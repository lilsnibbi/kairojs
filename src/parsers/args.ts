import type { Message } from "discord.js";
import type {
	ArgOptions,
	ArgsJson,
	ArgsNextCallback,
	ArgumentErrorOptions,
	ArgumentStreamState,
	ArrayResultType,
	Awaitable,
	Err,
	MessageCommand,
	MessageCommandRunContext,
	Ok,
	Parameter,
	RepeatArgOptions,
	ResolvedArgType,
	ResultType,
	StoreRegistryKey,
} from "@types";
import type { ArgumentStream } from "@utilities/lexure/index.ts";
import { join } from "@utilities/lexure/index.ts";
import { Option, Result } from "@utilities/result/index.ts";
import { container } from "@/container.ts";
import { Identifiers } from "@/constants/identifiers.ts";
import { ArgumentError } from "@/errors/argument-error.ts";
import { UserError } from "@/errors/user-error.ts";
import type { AliasStore } from "@/loader/alias-store.ts";
import type { Argument } from "@/structures/argument.ts";

/**
 * The parameter reader handed to every message command.
 *
 * A command receives one of these as its `args`, already pointed at whatever followed the command
 * name. Reading a value is a matter of naming the kind you want — `args.pick("user")`,
 * `args.rest("string")` — and the matching {@link Argument} does the resolving.
 *
 * Every reader comes in two flavours. The plain one (`pick`, `rest`, `repeat`) returns the value and
 * throws a {@link UserError} when it cannot, which suits a command that is happy to let the error
 * handler explain the failure. The `*Result` one returns a `Result` instead, which suits a command
 * that wants to recover, retry, or word the failure itself.
 *
 * Position is tracked as the reader advances, and {@link Args.save} / {@link Args.restore} wind it
 * back, so a command may attempt one parse, discard it, and try another.
 *
 * @since 1.0.0
 */
export class Args {
	/**
	 * The message the parameters were read from.
	 */
	public readonly message: Message;

	/**
	 * The command the message invoked.
	 */
	public readonly command: MessageCommand;

	/**
	 * The prefix and alias this invocation was matched by.
	 */
	public readonly commandContext: MessageCommandRunContext;

	/**
	 * The underlying parameter stream every reader draws from.
	 */
	protected readonly parser: ArgumentStream;

	/**
	 * The stack of positions captured by {@link Args.save}, popped by {@link Args.restore}.
	 */
	readonly #savedStates: ArgumentStreamState[] = [];

	/**
	 * @param message The message the parameters were read from.
	 * @param command The command the message invoked.
	 * @param parser The parameter stream to read from.
	 * @param context The prefix and alias this invocation was matched by.
	 */
	public constructor(
		message: Message,
		command: MessageCommand,
		parser: ArgumentStream,
		context: MessageCommandRunContext,
	) {
		this.message = message;
		this.command = command;
		this.parser = parser;
		this.commandContext = context;
	}

	/**
	 * Winds the reader all the way back, as if nothing had been read yet.
	 */
	public start(): Args {
		this.parser.reset();
		return this;
	}

	/**
	 * Reads the next parameter as the given argument, advancing only if it resolves.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !square 5
	 * const squarable = Args.make((parameter, { argument }) => {
	 *   const parsed = Number(parameter);
	 *   if (Number.isNaN(parsed)) {
	 *     return Args.error({ argument, parameter, identifier: "ArgumentNumberNaN", message: "Write a valid number." });
	 *   }
	 *
	 *   return Args.ok(parsed);
	 * });
	 *
	 * const base = await args.pickResult(squarable);
	 * if (base.isErr()) throw new UserError({ identifier: "ArgumentNumberNaN", message: "Write a valid number." });
	 *
	 * await message.channel.send(`The result is ${base.unwrap() ** 2}.`);
	 * // Sends "The result is 25."
	 * ```
	 */
	public async pickResult<T>(
		type: Argument<T>,
		options?: ArgOptions,
	): Promise<ResultType<T>>;
	/**
	 * Reads the next parameter as the named argument, advancing only if it resolves.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !add 1 2
	 * const first = await args.pickResult("integer");
	 * if (first.isErr()) throw new UserError({ identifier: "AddArgumentError", message: "The first number did not parse." });
	 *
	 * const second = await args.pickResult("integer");
	 * if (second.isErr()) throw new UserError({ identifier: "AddArgumentError", message: "The second number did not parse." });
	 *
	 * await message.channel.send(`The result is ${first.unwrap() + second.unwrap()}.`);
	 * // Sends "The result is 3."
	 * ```
	 */
	public async pickResult<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResultType<ResolvedArgType[K]>>;
	public async pickResult<K extends keyof ResolvedArgType>(
		type: K,
		options: ArgOptions = {},
	): Promise<ResultType<ResolvedArgType[K]>> {
		const argument = this.#resolveArgument<ResolvedArgType[K]>(type);
		if (!argument) return this.unavailableArgument(type);

		const result = await this.parser.singleParseAsync(async (parameter) =>
			argument.run(parameter, {
				args: this,
				argument,
				message: this.message,
				command: this.command,
				commandContext: this.commandContext,
				...options,
			}),
		);

		// The stream reports exhaustion by failing with `null` rather than with a parse error:
		if (result.isErrAnd((error) => error === null))
			return this.missingArguments();

		return result as ResultType<ResolvedArgType[K]>;
	}

	/**
	 * Reads the next parameter as the given argument, throwing if it does not resolve.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the parameter was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !square 5
	 * const squarable = Args.make((parameter, { argument }) => {
	 *   const parsed = Number(parameter);
	 *   if (Number.isNaN(parsed)) {
	 *     return Args.error({ argument, parameter, identifier: "ArgumentNumberNaN", message: "Write a valid number." });
	 *   }
	 *
	 *   return Args.ok(parsed);
	 * });
	 *
	 * const base = await args.pick(squarable);
	 *
	 * await message.channel.send(`The result is ${base ** 2}.`);
	 * // Sends "The result is 25."
	 * ```
	 */
	public async pick<T>(type: Argument<T>, options?: ArgOptions): Promise<T>;
	/**
	 * Reads the next parameter as the named argument, throwing if it does not resolve.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the parameter was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !add 1 2
	 * const first = await args.pick("integer");
	 * const second = await args.pick("integer");
	 *
	 * await message.channel.send(`The result is ${first + second}.`);
	 * // Sends "The result is 3."
	 * ```
	 */
	public async pick<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]>;
	public async pick<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]> {
		const result = await this.pickResult(type, options);
		return result.unwrapRaw();
	}

	/**
	 * Reads every remaining parameter as one value, joined back together with the spacing they were
	 * written with. The position is only advanced if the argument resolves.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !reverse Hello world!
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 *
	 * const text = await args.restResult(reversed);
	 * if (text.isErr()) throw new UserError({ identifier: "ReverseArgumentError", message: "Write some text." });
	 *
	 * await message.channel.send(`Reversed: ${text.unwrap()}`);
	 * // Sends "Reversed: !dlrow olleH"
	 * ```
	 */
	public async restResult<T>(
		type: Argument<T>,
		options?: ArgOptions,
	): Promise<ResultType<T>>;
	/**
	 * Reads every remaining parameter as one value, joined back together with the spacing they were
	 * written with. The position is only advanced if the argument resolves.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !repeat 2 Hello world!
	 * const times = await args.pickResult("integer");
	 * if (times.isErr()) throw new UserError({ identifier: "RepeatArgumentError", message: "The count did not parse." });
	 *
	 * const text = await args.restResult("string", { minimum: 1 });
	 * if (text.isErr()) throw new UserError({ identifier: "RepeatArgumentError", message: "The text did not parse." });
	 *
	 * await message.channel.send(text.unwrap().repeat(times.unwrap()));
	 * // Sends "Hello world!Hello world!"
	 * ```
	 */
	public async restResult<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResultType<ResolvedArgType[K]>>;
	public async restResult<T>(
		type: keyof ResolvedArgType | Argument<T>,
		options: ArgOptions = {},
	): Promise<ResultType<T>> {
		const argument = this.#resolveArgument<T>(type);
		if (!argument) return this.unavailableArgument(type);
		if (this.parser.finished) return this.missingArguments();

		const state = this.parser.save();
		const parameter = join(this.parser.many().unwrapOr<Parameter[]>([]));
		const result = await argument.run(parameter, {
			args: this,
			argument,
			message: this.message,
			command: this.command,
			commandContext: this.commandContext,
			...options,
		});

		// A rejected parse must not swallow the parameters it looked at:
		return result.inspectErr(() => this.parser.restore(state));
	}

	/**
	 * Reads every remaining parameter as one value, throwing if it does not resolve.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the text was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !reverse Hello world!
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 * const text = await args.rest(reversed);
	 *
	 * await message.channel.send(`Reversed: ${text}`);
	 * // Sends "Reversed: !dlrow olleH"
	 * ```
	 */
	public async rest<T>(type: Argument<T>, options?: ArgOptions): Promise<T>;
	/**
	 * Reads every remaining parameter as one value, throwing if it does not resolve.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the text was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !repeat 2 Hello world!
	 * const times = await args.pick("integer");
	 * const text = await args.rest("string", { minimum: 1 });
	 *
	 * await message.channel.send(text.repeat(times));
	 * // Sends "Hello world!Hello world!"
	 * ```
	 */
	public async rest<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]>;
	public async rest<K extends keyof ResolvedArgType>(
		type: K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]> {
		const result = await this.restResult(type, options);
		return result.unwrapRaw();
	}

	/**
	 * Reads parameters one at a time for as long as they keep resolving, up to `options.times`.
	 *
	 * Only a failure on the very first parameter is reported; once at least one value has been
	 * collected, a later failure simply ends the run and leaves that parameter unread.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument, plus how many times to repeat.
	 *
	 * @example
	 * ```typescript
	 * // !reverse-each Hello world!
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 *
	 * const words = await args.repeatResult(reversed, { times: 5 });
	 * if (words.isErr()) throw new UserError({ identifier: "CountArgumentError", message: "Write up to five words." });
	 *
	 * await message.channel.send(words.unwrap().join(" "));
	 * // Sends "olleH !dlrow"
	 * ```
	 */
	public async repeatResult<T>(
		type: Argument<T>,
		options?: RepeatArgOptions,
	): Promise<ArrayResultType<T>>;
	/**
	 * Reads parameters one at a time for as long as they keep resolving, up to `options.times`.
	 *
	 * Only a failure on the very first parameter is reported; once at least one value has been
	 * collected, a later failure simply ends the run and leaves that parameter unread.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument, plus how many times to repeat.
	 *
	 * @example
	 * ```typescript
	 * // !echo-each Hello world!
	 * const words = await args.repeatResult("string", { times: 5 });
	 * if (words.isErr()) throw new UserError({ identifier: "CountArgumentError", message: "Write up to five words." });
	 *
	 * await message.channel.send(`You wrote ${words.unwrap().length} word(s).`);
	 * // Sends "You wrote 2 word(s)."
	 * ```
	 */
	public async repeatResult<K extends keyof ResolvedArgType>(
		type: K,
		options?: RepeatArgOptions,
	): Promise<ArrayResultType<ResolvedArgType[K]>>;
	public async repeatResult<K extends keyof ResolvedArgType>(
		type: K,
		options: RepeatArgOptions = {},
	): Promise<ArrayResultType<ResolvedArgType[K]>> {
		const argument = this.#resolveArgument<ResolvedArgType[K]>(type);
		if (!argument) return this.unavailableArgument(type);
		if (this.parser.finished) return this.missingArguments();

		const output: ResolvedArgType[K][] = [];

		for (
			let index = 0, times = options.times ?? Infinity;
			index < times;
			index++
		) {
			const result = await this.parser.singleParseAsync(async (parameter) =>
				argument.run(parameter, {
					args: this,
					argument,
					message: this.message,
					command: this.command,
					commandContext: this.commandContext,
					...options,
				}),
			);

			if (result.isErr()) {
				const error = result.unwrapErr();

				// The stream ran dry, which simply ends the run:
				if (error === null) break;

				// A rejection on the very first parameter is the caller's problem; a later one just
				// marks where the run stops:
				if (output.length === 0)
					return result as Err<UserError | ArgumentError<ResolvedArgType[K]>>;

				break;
			}

			output.push(result.unwrap() as ResolvedArgType[K]);
		}

		return Result.ok(output);
	}

	/**
	 * Reads parameters one at a time for as long as they keep resolving, throwing if not even the
	 * first one does.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument, plus how many times to repeat.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the first parameter was
	 * rejected.
	 *
	 * @example
	 * ```typescript
	 * // !reverse-each Hello world!
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 * const words = await args.repeat(reversed, { times: 5 });
	 *
	 * await message.channel.send(words.join(" "));
	 * // Sends "olleH !dlrow"
	 * ```
	 */
	public async repeat<T>(
		type: Argument<T>,
		options?: RepeatArgOptions,
	): Promise<T[]>;
	/**
	 * Reads parameters one at a time for as long as they keep resolving, throwing if not even the
	 * first one does.
	 *
	 * @param type The name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument, plus how many times to repeat.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the first parameter was
	 * rejected.
	 *
	 * @example
	 * ```typescript
	 * // !echo-each Hello world!
	 * const words = await args.repeat("string", { times: 5 });
	 *
	 * await message.channel.send(`You wrote ${words.length} word(s).`);
	 * // Sends "You wrote 2 word(s)."
	 * ```
	 */
	public async repeat<K extends keyof ResolvedArgType>(
		type: K,
		options?: RepeatArgOptions,
	): Promise<ResolvedArgType[K][]>;
	public async repeat<K extends keyof ResolvedArgType>(
		type: K,
		options?: RepeatArgOptions,
	): Promise<ResolvedArgType[K][]> {
		const result = await this.repeatResult(type, options);
		return result.unwrapRaw();
	}

	/**
	 * Runs a read and then winds the position back, so the parameters stay available.
	 *
	 * Passing a function lets you peek at anything at all — a whole {@link Args.repeatResult} run, a
	 * {@link Args.restResult}, several reads in a row. Passing an argument or a name peeks a single
	 * parameter through {@link Args.pickResult}.
	 *
	 * @param type The read to perform.
	 *
	 * @example
	 * ```typescript
	 * // !reverse-then-shout hello world
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 *
	 * const peeked = await args.peekResult(() => args.repeatResult(reversed));
	 * await peeked.inspectAsync((words) => message.channel.send(words.join(" "))); // olleh dlrow
	 *
	 * const first = await args.pickResult("string");
	 * await first.inspectAsync((word) => message.channel.send(word.toUpperCase())); // HELLO
	 * ```
	 */
	public async peekResult<T>(
		type: () => Result<T, ArgumentError<T>>,
	): Promise<ResultType<T>>;
	/**
	 * Runs a read and then winds the position back, so the parameters stay available.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !reverse-then-shout kairo bots
	 * const reversed = Args.make((parameter) => Args.ok([...parameter].reverse().join("")));
	 *
	 * const peeked = await args.peekResult(reversed);
	 * await peeked.inspectAsync((word) => message.channel.send(word)); // oriak
	 *
	 * const first = await args.pickResult("string");
	 * await first.inspectAsync((word) => message.channel.send(word.toUpperCase())); // KAIRO
	 * ```
	 */
	public async peekResult<T>(
		type: Argument<T>,
		options?: ArgOptions,
	): Promise<ResultType<T>>;
	/**
	 * Runs a read and then winds the position back, so the parameters stay available.
	 *
	 * @param type The read to perform, or the name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @example
	 * ```typescript
	 * // !date-then-add-two 1608867472611
	 * const date = await args.peekResult("date");
	 * await date.inspectAsync((value) => message.channel.send(value.toUTCString()));
	 * // Fri, 25 Dec 2020 03:37:52 GMT
	 *
	 * const number = await args.pickResult("number", { maximum: Number.MAX_SAFE_INTEGER - 2 });
	 * await number.inspectAsync((value) => message.channel.send(`Plus two: ${value + 2}`));
	 * // Plus two: 1608867472613
	 * ```
	 */
	public async peekResult<K extends keyof ResolvedArgType>(
		type:
			| (() => Awaitable<
					Result<ResolvedArgType[K], ArgumentError<ResolvedArgType[K]>>
			  >)
			| K,
		options?: ArgOptions,
	): Promise<ResultType<ResolvedArgType[K]>>;

	public async peekResult<K extends keyof ResolvedArgType>(
		type:
			| (() => Awaitable<
					Result<ResolvedArgType[K], ArgumentError<ResolvedArgType[K]>>
			  >)
			| K,
		options: ArgOptions = {},
	): Promise<ResultType<ResolvedArgType[K]>> {
		this.save();
		const result =
			typeof type === "function"
				? await type()
				: await this.pickResult(type, options);
		this.restore();
		return result;
	}

	/**
	 * Runs a read, winds the position back, and returns the value, throwing if it did not resolve.
	 *
	 * @param type The read to perform.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the read was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !sum-then-square-first 25 50 75
	 * const bigints = Args.make((parameter, { argument }) => {
	 *   try {
	 *     return Args.ok(BigInt(parameter));
	 *   } catch {
	 *     return Args.error({ parameter, argument, identifier: "InvalidBigInt", message: "Write a valid number." });
	 *   }
	 * });
	 *
	 * const all = await args.peek(() => args.repeat(bigints));
	 * await message.channel.send(`Sum: ${all.reduce((left, right) => left + right, 0n)}`); // Sum: 150
	 *
	 * const first = await args.pick(bigints);
	 * await message.channel.send(`First squared: ${first ** 2n}`); // First squared: 625
	 * ```
	 */
	public async peek<T>(type: () => Result<T, ArgumentError<T>>): Promise<T>;
	/**
	 * Runs a read, winds the position back, and returns the value, throwing if it did not resolve.
	 *
	 * @param type The argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the read was rejected.
	 *
	 * @example
	 * ```typescript
	 * import { SnowflakeRegex } from "kairojs";
	 * import { DiscordSnowflake } from "kairojs";
	 *
	 * // !created-at 730159185517477900
	 * const snowflakes = Args.make<bigint>((parameter, { argument }) =>
	 *   SnowflakeRegex.test(parameter)
	 *     ? Args.ok(BigInt(parameter))
	 *     : Args.error({ parameter, argument, identifier: "InvalidSnowflake", message: "Write a valid snowflake." })
	 * );
	 *
	 * const snowflake = await args.peek(snowflakes);
	 * const createdAt = new Date(Number((snowflake >> 22n) + DiscordSnowflake.epoch));
	 *
	 * await message.channel.send(`${snowflake} was created on ${createdAt.toUTCString()}.`);
	 *
	 * const raw = await args.pick("string");
	 * await message.channel.send(`Reversed: ${[...raw].reverse().join("")}`);
	 * ```
	 */
	public async peek<T>(type: Argument<T>, options?: ArgOptions): Promise<T>;
	/**
	 * Runs a read, winds the position back, and returns the value, throwing if it did not resolve.
	 *
	 * @param type The read to perform, or the name of the argument to resolve with.
	 * @param options Extra detail to hand to the argument.
	 *
	 * @throws A {@link UserError} or {@link ArgumentError} describing why the read was rejected.
	 *
	 * @example
	 * ```typescript
	 * // !message-link https://discord.com/channels/737141877803057244/737142209639350343/791843123898089483
	 * const linked = await args.peek("message");
	 * await message.channel.send(`${linked.author.tag}: ${linked.content}`);
	 *
	 * const url = await args.pick("hyperlink");
	 * await message.channel.send(`Hostname: ${url.hostname}`); // Hostname: discord.com
	 * ```
	 */
	public async peek<K extends keyof ResolvedArgType>(
		type:
			| (() => Result<ResolvedArgType[K], ArgumentError<ResolvedArgType[K]>>)
			| K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]>;
	public async peek<K extends keyof ResolvedArgType>(
		type:
			| (() => Result<ResolvedArgType[K], ArgumentError<ResolvedArgType[K]>>)
			| K,
		options?: ArgOptions,
	): Promise<ResolvedArgType[K]> {
		const result = await this.peekResult(type, options);
		return result.unwrapRaw();
	}

	/**
	 * Takes the next parameter as raw text, without involving an argument.
	 *
	 * @example
	 * ```typescript
	 * // !numbers 1 2 3
	 * console.log(args.nextMaybe());
	 * // Some { value: "1" }
	 * ```
	 */
	public nextMaybe(): Option<string>;
	/**
	 * Takes the next parameter only if the callback can map it, leaving it in place otherwise.
	 *
	 * @typeparam T What the callback produces.
	 * @param callback Maps the raw parameter, or reports failure with `none`.
	 *
	 * @example
	 * ```typescript
	 * // !numbers 1 2 3
	 * const toNumber = (value: string) => {
	 *   const parsed = Number(value);
	 *   return Number.isNaN(parsed) ? none() : some(parsed);
	 * };
	 *
	 * console.log(args.nextMaybe(toNumber));
	 * // Some { value: 1 }
	 * ```
	 */
	public nextMaybe<T>(callback: ArgsNextCallback<T>): Option<T>;
	public nextMaybe<T>(callback?: ArgsNextCallback<T>): Option<T | string> {
		return Option.from<T | string>(
			typeof callback === "function"
				? this.parser.singleMap(callback)
				: this.parser.single(),
		);
	}

	/**
	 * Takes the next parameter as raw text, or `null` once none are left.
	 *
	 * @example
	 * ```typescript
	 * // !numbers 1 2 3
	 * console.log(args.next());
	 * // "1"
	 * ```
	 */
	public next(): string;
	/**
	 * Takes the next parameter only if the callback can map it, or `null` otherwise.
	 *
	 * @typeparam T What the callback produces.
	 * @param callback Maps the raw parameter, or reports failure with `none`.
	 *
	 * @example
	 * ```typescript
	 * // !numbers 1 2 3
	 * const toNumber = (value: string) => {
	 *   const parsed = Number(value);
	 *   return Number.isNaN(parsed) ? none() : some(parsed);
	 * };
	 *
	 * console.log(args.next(toNumber));
	 * // 1
	 * ```
	 */
	public next<T>(callback: ArgsNextCallback<T>): T;
	public next<T>(callback?: ArgsNextCallback<T>): T | string | null {
		const value = callback
			? this.nextMaybe<T | string | null>(callback)
			: this.nextMaybe();
		return value.unwrapOr(null);
	}

	/**
	 * Whether any of the named flags was given.
	 *
	 * @param keys The flag names to look for.
	 *
	 * @example
	 * ```typescript
	 * // Given "--f --g":
	 * console.log(args.getFlags("f")); // true
	 * console.log(args.getFlags("g", "h")); // true
	 * console.log(args.getFlags("h")); // false
	 * ```
	 */
	public getFlags(...keys: readonly string[]): boolean {
		return this.parser.flag(...keys);
	}

	/**
	 * The last value given to any of the named options, as an {@link Option}.
	 *
	 * @see {@link Args.getOption} for the variant that returns `null` instead.
	 *
	 * @param keys The option names to look for.
	 *
	 * @example
	 * ```typescript
	 * // Given "--a=1 --b=2 --c=3":
	 * console.log(args.getOptionResult("a")); // Some { value: "1" }
	 * console.log(args.getOptionResult("b", "c")); // Some { value: "3" }
	 * console.log(args.getOptionResult("d")); // None
	 * ```
	 */
	public getOptionResult(...keys: readonly string[]): Option<string> {
		return this.parser.option(...keys);
	}

	/**
	 * The last value given to any of the named options, or `null` if none were given.
	 *
	 * @see {@link Args.getOptionResult} for the variant that returns an {@link Option}.
	 *
	 * @param keys The option names to look for.
	 *
	 * @example
	 * ```typescript
	 * // Given "--a=1 --b=2 --c=3":
	 * console.log(args.getOption("a")); // "1"
	 * console.log(args.getOption("b", "c")); // "3"
	 * console.log(args.getOption("d")); // null
	 * ```
	 */
	public getOption(...keys: readonly string[]): string | null {
		return this.parser.option(...keys).unwrapOr(null);
	}

	/**
	 * Every value given to any of the named options, as an {@link Option}.
	 *
	 * @see {@link Args.getOptions} for the variant that returns `null` instead.
	 *
	 * @param keys The option names to look for.
	 *
	 * @example
	 * ```typescript
	 * // Given "--a=1 --a=1 --b=2 --c=3":
	 * console.log(args.getOptionsResult("a")); // Some { value: ["1", "1"] }
	 * console.log(args.getOptionsResult("b", "c")); // Some { value: ["2", "3"] }
	 * console.log(args.getOptionsResult("d")); // None
	 * ```
	 */
	public getOptionsResult(
		...keys: readonly string[]
	): Option<readonly string[]> {
		return this.parser.options(...keys);
	}

	/**
	 * Every value given to any of the named options, or `null` if none were given.
	 *
	 * @see {@link Args.getOptionsResult} for the variant that returns an {@link Option}.
	 *
	 * @param keys The option names to look for.
	 *
	 * @example
	 * ```typescript
	 * // Given "--a=1 --a=1 --b=2 --c=3":
	 * console.log(args.getOptions("a")); // ["1", "1"]
	 * console.log(args.getOptions("b", "c")); // ["2", "3"]
	 * console.log(args.getOptions("d")); // null
	 * ```
	 */
	public getOptions(...keys: readonly string[]): readonly string[] | null {
		return this.parser.options(...keys).unwrapOr(null);
	}

	/**
	 * Pushes the current position onto a stack, to be wound back by {@link Args.restore}.
	 *
	 * The stack is last-in first-out, so nested save/restore pairs behave the way they read.
	 */
	public save(): void {
		this.#savedStates.push(this.parser.save());
	}

	/**
	 * Pops the most recently saved position and winds the reader back to it.
	 *
	 * Does nothing when nothing was saved.
	 *
	 * @see {@link Args.save}
	 */
	public restore(): void {
		if (this.#savedStates.length !== 0)
			this.parser.restore(this.#savedStates.pop()!);
	}

	/**
	 * Whether every parameter has been read.
	 */
	public get finished(): boolean {
		return this.parser.finished;
	}

	/**
	 * The snapshot `JSON.stringify` uses, and the `context` attached to the errors raised here.
	 */
	public toJSON(): ArgsJson {
		return {
			message: this.message,
			command: this.command,
			commandContext: this.commandContext,
		};
	}

	/**
	 * Builds the failure raised when no argument answers to the requested name.
	 *
	 * @param type The argument, or the name that could not be found.
	 */
	protected unavailableArgument<T>(type: string | Argument<T>): Err<UserError> {
		const name = typeof type === "string" ? type : type.name;
		return Result.err(
			new UserError({
				identifier: Identifiers.ArgsUnavailable,
				message: `The argument "${name}" was not found.`,
				context: { name, ...this.toJSON() },
			}),
		);
	}

	/**
	 * Builds the failure raised when a read is attempted but no parameters are left.
	 */
	protected missingArguments(): Err<UserError> {
		return Result.err(
			new UserError({
				identifier: Identifiers.ArgsMissing,
				message: "There are no more arguments.",
				context: this.toJSON(),
			}),
		);
	}

	/**
	 * Turns a name or an argument into the argument to run, looking names up in the arguments store.
	 *
	 * @param type The argument, or the name to look up.
	 */
	#resolveArgument<T>(
		type: keyof ResolvedArgType | Argument<T>,
	): Argument<T> | undefined {
		if (typeof type === "object") return type;

		const store = container.stores.get("arguments" as StoreRegistryKey) as
			| AliasStore<Argument<T>>
			| undefined;
		return store?.get(type as string);
	}

	/**
	 * Wraps a callback into a usable argument, for one-off resolvers that do not deserve a file of
	 * their own.
	 *
	 * Only the name and the callback are ever read while parsing, so the result stands in for a
	 * fully loaded piece everywhere `Args` accepts one.
	 *
	 * @param callback The resolver to run against a parameter.
	 * @param name The name to report when the resolver rejects a parameter.
	 *
	 * @example
	 * ```typescript
	 * const evenNumber = Args.make<number>((parameter, { argument }) => {
	 *   const parsed = Number(parameter);
	 *   return Number.isInteger(parsed) && parsed % 2 === 0
	 *     ? Args.ok(parsed)
	 *     : Args.error({ parameter, argument, identifier: "NotEven", message: "Write an even number." });
	 * }, "evenNumber");
	 *
	 * const value = await args.pick(evenNumber);
	 * ```
	 */
	public static make<T>(callback: Argument<T>["run"], name = ""): Argument<T> {
		return { name, run: callback } as unknown as Argument<T>;
	}

	/**
	 * Reports a parameter as successfully resolved.
	 *
	 * @param value The resolved value.
	 */
	public static ok<T>(value: T): Ok<T> {
		return Result.ok(value);
	}

	/**
	 * Reports a parameter as rejected, wrapping the reason in an {@link ArgumentError}.
	 *
	 * @param options The argument that rejected the parameter, the parameter itself, and why.
	 */
	public static error<T>(
		options: ArgumentErrorOptions<T>,
	): Err<ArgumentError<T>> {
		return Result.err(new ArgumentError<T>(options));
	}
}
