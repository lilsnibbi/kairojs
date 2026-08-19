import type {
	AnyOption,
	Awaitable,
	Err,
	If,
	None,
	Ok,
	OptionResolvable,
	Some,
	UnwrapSome,
	UnwrapSomeArray,
} from "@types";
import { err, ok, type Result } from "./result.ts";
import { OptionError } from "./errors.ts";
import { isFunction, returnThis } from "./internal.ts";

const ValueSymbol = Symbol.for("kairo:option.value");
const ExistsSymbol = Symbol.for("kairo:option.exists");

/**
 * Represents a value that may or may not be present, without relying on `null` or `undefined` to
 * mean "absent". An `Option` is always either `Some`, carrying a value, or `None`, carrying
 * nothing.
 *
 * `some(value)` builds a `Some`, and the shared `none` constant is the only `None` that ever
 * exists. Every instance method below narrows or transforms the wrapped value while keeping track,
 * at the type level, of whether it is present.
 *
 * @typeparam T The type of the wrapped value.
 *
 * @see {@link https://doc.rust-lang.org/std/option/index.html}
 *
 * @since 1.0.0
 */
export class Option<T, Exists extends boolean = boolean> {
	/**
	 * Branded field that pins `Exists` to its exact literal type instead of letting it widen to
	 * `boolean`. Never assigned, never read — its only job is to appear in the type.
	 * @internal
	 */
	protected declare __STATUS__: Exists;

	private readonly [ValueSymbol]: If<Exists, T, null>;
	private readonly [ExistsSymbol]: Exists;

	private constructor(value: If<Exists, T, null>, exists: Exists) {
		this[ValueSymbol] = value;
		this[ExistsSymbol] = exists;
	}

	/**
	 * Reports whether this option is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * assert.equal(x.isSome(), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * assert.equal(x.isSome(), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.is_some}
	 */
	public isSome(): this is Some<T> {
		return this[ExistsSymbol];
	}

	/**
	 * Reports whether this option is `Some` and its value satisfies `predicate`.
	 *
	 * @param predicate Checked against the wrapped value when this is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * assert.equal(x.isSomeAnd((x) => x > 1), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(0);
	 * assert.equal(x.isSomeAnd((x) => x > 1), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * assert.equal(x.isSomeAnd((x) => x > 1), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.is_some_and}
	 */
	public isSomeAnd<Refined extends T>(
		predicate: (value: T) => value is Refined,
	): this is Some<Refined>;
	public isSomeAnd<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): this is Some<Matched> & Matched;
	public isSomeAnd<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): this is Some<Matched> & Matched {
		return this.isSome() && predicate(this[ValueSymbol]);
	}

	/**
	 * Reports whether this option is `None`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * assert.equal(x.isNone(), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * assert.equal(x.isNone(), true);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.is_none}
	 */
	public isNone(): this is None {
		return !this[ExistsSymbol];
	}

	/**
	 * Reports whether this option is `None`, or its value satisfies `predicate` when it is `Some`.
	 *
	 * @param predicate Checked against the wrapped value when this is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * assert.equal(x.isNoneOr((x) => x > 1), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(0);
	 * assert.equal(x.isNoneOr((x) => x > 1), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * assert.equal(x.isNoneOr((x) => x > 1), true);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.is_none_or}
	 */
	public isNoneOr<Refined extends T>(
		predicate: (value: T) => value is Refined,
	): this is None | Some<Refined>;
	public isNoneOr<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): If<Exists, Matched, true>;
	public isNoneOr<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): If<Exists, Matched, true> {
		return this.match({ some: (value) => predicate(value), none: () => true });
	}

	/**
	 * Returns the wrapped value, or throws an {@link OptionError} carrying `message` when this is
	 * `None`.
	 *
	 * @param message The message the thrown error should carry.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some(2);
	 * assert.equal(x.expect("Whoops!"), 2);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.throws(() => x.expect("Whoops!"), {
	 *   name: "OptionError",
	 *   message: "Whoops"
	 * });
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.expect}
	 */
	public expect(message: string): If<Exists, T, never> {
		if (this.isNone()) throw new OptionError(message);
		// @ts-expect-error Complex types
		return this[ValueSymbol];
	}

	/**
	 * Returns the wrapped value, or throws an {@link OptionError} with a generic message when this
	 * is `None`.
	 *
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapOrElse}
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some(2);
	 * assert.equal(x.unwrap(), 2);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.throws(() => x.unwrap(), {
	 *   name: "OptionError",
	 *   message: "Unwrap failed"
	 * });
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap}
	 */
	public unwrap(): If<Exists, T, never> {
		if (this.isNone()) throw new OptionError("Unwrap failed");
		// @ts-expect-error Complex types
		return this[ValueSymbol];
	}

	/**
	 * Returns the wrapped value, or `defaultValue` when this is `None`.
	 *
	 * `defaultValue` is evaluated eagerly even when this is `Some` — reach for {@link unwrapOrElse}
	 * to defer that computation to a closure instead.
	 *
	 * @example
	 * ```typescript
	 * assert.equal(some(2).unwrapOr(0), 2);
	 * ```
	 * @example
	 * ```typescript
	 * assert.equal(none.unwrapOr(0), 0);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or}
	 */
	public unwrapOr<OutputValue>(
		defaultValue: OutputValue,
	): If<Exists, T, OutputValue> {
		return this.match({ some: (value) => value, none: () => defaultValue });
	}

	/**
	 * Returns the wrapped value, or the result of calling `onNone` when this is `None`.
	 *
	 * @example
	 * ```typescript
	 * assert.equal(some(2).unwrapOrElse(() => 0), 2);
	 * ```
	 * @example
	 * ```typescript
	 * assert.equal(none.unwrapOrElse(() => 0), 0);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or_else}
	 */
	public unwrapOrElse<OutputValue>(
		onNone: () => OutputValue,
	): If<Exists, T, OutputValue> {
		return this.match({ some: (value) => value, none: onNone });
	}

	/**
	 * Runs `transform` on the wrapped value when this is `Some`, rewrapping its return value in a new
	 * `Some`. `None` passes through untouched.
	 *
	 * @param transform Applied to the wrapped value.
	 *
	 * @example
	 * ```typescript
	 * const maybeSomeString = some("Hello, world!");
	 * const maybeSomeLength = maybeSomeString.map((value) => value.length);
	 *
	 * assert.equal(maybeSomeLength, some(13));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.map}
	 */
	public map<OutputValue>(
		transform: (value: T) => OutputValue,
	): Option<OutputValue, Exists> {
		// @ts-expect-error Complex types
		return this.match({
			some: (value) => some(transform(value)),
			none: returnThis,
		});
	}

	/**
	 * Runs `transform` on the wrapped value when this is `Some`, returning whatever `Option` it
	 * produces directly instead of rewrapping it in another `Some`. `None` passes through untouched.
	 *
	 * @param transform Applied to the wrapped value; returns the replacement `Option`.
	 *
	 * @example
	 * ```typescript
	 * const input: Option<string> = some("Hello, world!");
	 * const result = input.mapInto((value) => some(value.length));
	 *
	 * assert.equal(result, some(13));
	 * ```
	 * @example
	 * ```typescript
	 * const input: Option<string> = none;
	 * const result = input.mapInto((value) => some(value.length));
	 *
	 * assert.equal(result, none);
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public mapInto<OutputOption extends AnyOption>(
		transform: (value: T) => OutputOption,
	): OutputOption {
		// @ts-expect-error Complex types
		return this.match({ some: (value) => transform(value), none: returnThis });
	}

	/**
	 * Resolves to `defaultValue` when this is `None`, or to `transform` applied to the wrapped value
	 * when this is `Some`.
	 *
	 * `defaultValue` is evaluated eagerly even when this is `Some` — reach for {@link mapOrElse} to
	 * defer that computation to a closure instead.
	 *
	 * @param defaultValue Returned as-is when this is `None`.
	 * @param transform Applied to the wrapped value when this is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some("hello");
	 * assert.equal(x.mapOr(42, (value) => value.length), 5);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.equal(x.mapOr(42, (value) => value.length), 42);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.map_or}
	 */
	public mapOr<MappedOutputValue, DefaultOutputValue>(
		defaultValue: DefaultOutputValue,
		transform: (value: T) => MappedOutputValue,
	): If<Exists, MappedOutputValue, DefaultOutputValue> {
		return this.match({
			some: (value) => transform(value),
			none: () => defaultValue,
		});
	}

	/**
	 * Resolves to the result of calling `onNone` when this is `None`, or `transform` applied to the
	 * wrapped value when this is `Some`.
	 *
	 * @param onNone Computes the fallback value when this is `None`.
	 * @param transform Applied to the wrapped value when this is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some("hello");
	 * assert.equal(x.mapOrElse(() => 42, (value) => value.length), 5);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.equal(x.mapOrElse(() => 42, (value) => value.length), 42);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.map_or_else}
	 */
	public mapOrElse<OutputValue, OutputNone>(
		onNone: () => OutputNone,
		transform: (value: T) => OutputValue,
	): If<Exists, OutputValue, OutputNone> {
		return this.match({
			some: (value) => transform(value),
			none: () => onNone(),
		});
	}

	/**
	 * Runs `transform` when this is `None`, returning whatever `Option` it produces directly. `Some`
	 * passes through untouched.
	 *
	 * @param transform Called with no arguments; returns the replacement `Option`.
	 *
	 * @example
	 * ```typescript
	 * const input: Option<string> = some("Hello, world!");
	 * const result = input.mapNoneInto(() => some(13));
	 *
	 * assert.equal(result, some("Hello, world!"));
	 * ```
	 * @example
	 * ```typescript
	 * const input: Option<string> = none;
	 * const result = input.mapNoneInto(() => some(13));
	 *
	 * assert.equal(result, some(13));
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public mapNoneInto<OutputOption extends AnyOption>(
		transform: () => OutputOption,
	): If<Exists, Some<T>, OutputOption> {
		return this.match({ some: returnThis, none: transform });
	}

	/**
	 * Runs `callback` with the wrapped value when this is `Some`, purely for its side effect, and
	 * returns this same option unchanged either way.
	 *
	 * @param callback Called with the wrapped value.
	 * @seealso {@link inspectAsync} for the awaitable version.
	 *
	 * @example
	 * ```typescript
	 * some(2).inspect(console.log);
	 * // Logs: 2
	 * ```
	 * @example
	 * ```typescript
	 * none.inspect(console.log);
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.inspect}
	 */
	public inspect(callback: (value: T) => void): this {
		if (this.isSome()) callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Runs `callback` with the wrapped value when this is `Some` and awaits it before resolving,
	 * returning this same option unchanged either way.
	 *
	 * @param callback Called with the wrapped value; may return a promise.
	 * @seealso {@link inspect} for the synchronous version.
	 *
	 * @example
	 * ```typescript
	 * await some(2).inspectAsync(console.log);
	 * // Logs: 2
	 * ```
	 * @example
	 * ```typescript
	 * await none.inspectAsync(console.log);
	 * // Doesn't log
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public async inspectAsync(
		callback: (value: T) => Awaitable<unknown>,
	): Promise<this> {
		if (this.isSome()) await callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Converts this `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to
	 * `Err(error)`.
	 *
	 * `error` is evaluated eagerly even when this is `Some` — reach for {@link okOrElse} to defer
	 * that computation to a closure instead.
	 *
	 * @param error The error to use when this is `None`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some("hello");
	 * assert.equal(x.okOr(0), ok("hello"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.equal(x.okOr(0), err(0));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.ok_or}
	 */
	public okOr<ErrorValue>(
		error: ErrorValue,
	): If<Exists, Ok<T>, Err<ErrorValue>> {
		return this.match({ some: (value) => ok(value), none: () => err(error) });
	}

	/**
	 * Converts this `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to
	 * `Err(onNone())`.
	 *
	 * @param onNone Computes the error to use when this is `None`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<string> = some("hello");
	 * assert.equal(x.okOrElse(() => 0), ok("hello"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<string> = none;
	 * assert.equal(x.okOrElse(() => 0), err(0));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.ok_or_else}
	 */
	public okOrElse<ErrorValue>(
		onNone: () => ErrorValue,
	): If<Exists, Ok<T>, Err<ErrorValue>> {
		return this.match({
			some: (value) => ok(value),
			none: () => err(onNone()),
		});
	}

	/**
	 * Iterates the wrapped value: yields it once when this is `Some`, yields nothing when this is
	 * `None`.
	 *
	 * @example
	 * ```typescript
	 * const x = some(7);
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Logs 7
	 * ```
	 * @example
	 * ```typescript
	 * const x = none;
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link Option.iter}
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.iter}
	 */
	public *iter(): Generator<T> {
		if (this.isSome()) yield this[ValueSymbol];
	}

	/**
	 * Returns `None` when this is `None`, otherwise returns `option`.
	 *
	 * @param option The option to return in place of this one when this is `Some`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<string> = none;
	 * assert.equal(x.and(y), none);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<string> = some("foo");
	 * assert.equal(x.and(y), none);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<string> = some("foo");
	 * assert.equal(x.and(y), some("foo"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<string> = none;
	 * assert.equal(x.and(y), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.and}
	 */
	public and<OutputOption extends AnyOption>(
		option: OutputOption,
	): If<Exists, OutputOption, None> {
		return this.match({ some: () => option, none: returnThis });
	}

	/**
	 * Runs `transform` with the wrapped value when this is `Some`, returning whatever `Option` it
	 * produces. Otherwise returns `None`. Chains a step that may itself come up empty.
	 *
	 * @param transform Applied to the wrapped value; returns the next `Option` in the chain.
	 *
	 * @example
	 * ```typescript
	 * function fractionOf4(value: number) {
	 *   return value === 0 ? none : some(4 / value);
	 * }
	 *
	 * assert.equal(some(2).andThen(fractionOf4), some(4));
	 * assert.equal(some(0).andThen(fractionOf4), none);
	 * assert.equal(none.andThen(fractionOf4), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.and_then}
	 */
	public andThen<OutputOption extends AnyOption>(
		transform: (value: T) => OutputOption,
	): OutputOption {
		// @ts-expect-error Complex types
		return this.match({ some: (value) => transform(value), none: returnThis });
	}

	/**
	 * Returns this option unchanged when it is `Some`, otherwise returns `option`.
	 *
	 * `option` is evaluated eagerly even when this is `Some` — reach for {@link orElse} to defer that
	 * computation to a closure instead.
	 *
	 * @param option The option to return in place of this one when this is `None`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<number> = none;
	 * assert.equal(x.or(y), some(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<number> = some(100);
	 * assert.equal(x.or(y), some(100));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<number> = some(100);
	 * assert.equal(x.or(y), some(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<number> = none;
	 * assert.equal(x.or(y), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.or}
	 */
	public or<OutputOption extends AnyOption>(
		option: OutputOption,
	): If<Exists, Some<T>, OutputOption> {
		return this.match({ some: returnThis, none: () => option });
	}

	/**
	 * Returns this option unchanged when it is `Some`, otherwise returns whatever `Option`
	 * `transform` produces.
	 *
	 * @param transform Called with no arguments; returns the replacement `Option`.
	 *
	 * @example
	 * ```typescript
	 * const nobody = (): Option<string> => none;
	 * const vikings = (): Option<string> => some("vikings");
	 *
	 * assert.equal(some("barbarians").orElse(vikings), some("barbarians"));
	 * assert.equal(none.orElse(vikings), some("vikings"));
	 * assert.equal(none.orElse(nobody), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.or_else}
	 */
	public orElse<OutputOption extends AnyOption>(
		transform: () => OutputOption,
	): If<Exists, Some<T>, OutputOption> {
		return this.match({ some: returnThis, none: () => transform() });
	}

	/**
	 * Returns `Some` when exactly one of this option and `option` is `Some`, otherwise returns
	 * `None`.
	 *
	 * @param option The option to compare against.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<number> = none;
	 * assert.equal(x.xor(y), some(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<number> = some(2);
	 * assert.equal(x.xor(y), some(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * const y: Option<number> = some(2);
	 * assert.equal(x.xor(y), none);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * const y: Option<number> = none;
	 * assert.equal(x.xor(y), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.xor}
	 */
	public xor<OtherValue, OtherExists extends boolean>(
		option: Option<OtherValue, OtherExists>,
	): If<
		Exists,
		If<OtherExists, None, Some<T>>,
		Option<OtherValue, OtherExists>
	> {
		return this.match<
			If<OtherExists, None, Some<T>>,
			Option<OtherValue, OtherExists>
		>({
			some() {
				return (option.isNone() ? this : none) as If<
					OtherExists,
					None,
					Some<T>
				>;
			},
			none: () => option,
		});
	}

	/**
	 * Returns `None` when this is `None`. Otherwise calls `predicate` with the wrapped value and
	 * returns `Some(value)` when it passes, or `None` when it fails.
	 *
	 * @param predicate The predicate the wrapped value must satisfy.
	 *
	 * @example
	 * ```typescript
	 * function isEven(value: number) {
	 *   return value % 2 === 0;
	 * }
	 *
	 * assert.equal(none.filter(isEven), none);
	 * assert.equal(some(3).filter(isEven), none);
	 * assert.equal(some(4).filter(isEven), some(4));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.filter}
	 */
	public filter<Refined extends T>(
		predicate: (value: T) => value is Refined,
	): Option<Refined>;
	public filter(predicate: (value: T) => boolean): Option<T>;
	public filter(predicate: (value: T) => boolean): Option<T> {
		return this.isSomeAnd(predicate) ? this : none;
	}

	/**
	 * Reports whether this is a `Some` whose value strictly equals `value`.
	 *
	 * @param value The value to compare against.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(2);
	 * assert.equal(x.contains(2), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = some(3);
	 * assert.equal(x.contains(2), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<number> = none;
	 * assert.equal(x.contains(2), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.contains}
	 */
	public contains<const Value extends T>(
		value: If<Exists, Value, unknown>,
	): this is Some<Value> {
		return this.isSomeAnd((inner) => inner === value);
	}

	/**
	 * Pairs this option with `other`. Returns `Some([a, b])` when both are `Some`, otherwise `None`.
	 *
	 * @param other The option to pair this one with.
	 *
	 * @example
	 * ```typescript
	 * const x = some(1);
	 * const y = some("hi");
	 * const z = none;
	 *
	 * assert.equal(x.zip(y), some([1, "hi"]));
	 * assert.equal(x.zip(z), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.zip}
	 */
	public zip<OtherValue, OtherExists extends boolean>(
		other: Option<OtherValue, OtherExists>,
	): Option<[T, OtherValue], If<Exists, OtherExists, false>> {
		// @ts-expect-error Complex types
		return this.isSome() && other.isSome()
			? some([this[ValueSymbol], other[ValueSymbol]] as [T, OtherValue])
			: none;
	}

	/**
	 * Pairs this option with `other` through `combine`. Returns `Some(combine(a, b))` when both are
	 * `Some`, otherwise `None`.
	 *
	 * @param other The option to pair this one with.
	 * @param combine Computes the returned value from both wrapped values.
	 *
	 * @example
	 * ```typescript
	 * class Point {
	 *   public readonly x: number;
	 *   public readonly y: number;
	 *
	 *   public constructor(x: number, y: number) {
	 *     this.x = x;
	 *     this.y = y;
	 *   }
	 * }
	 *
	 * const x = some(17.5);
	 * const y = some(42.7);
	 *
	 * assert.equal(x.zipWith(y, (s, o) => new Point(s, o)), some(new Point(17.5, 42.7)));
	 * assert.equal(x.zipWith(none, (s, o) => new Point(s, o)), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.zip_with}
	 */
	public zipWith<OtherValue, OtherExists extends boolean, ReturnValue>(
		other: Option<OtherValue, OtherExists>,
		combine: (value: T, otherValue: OtherValue) => ReturnValue,
	): Option<ReturnValue, If<Exists, OtherExists, false>> {
		// @ts-expect-error Complex types
		return this.isSome() && other.isSome()
			? some(combine(this[ValueSymbol], other[ValueSymbol]))
			: none;
	}

	/**
	 * Splits an option containing a two-element tuple into a tuple of two options: `Some([a, b])`
	 * becomes `[Some(a), Some(b)]`, `None` becomes `[None, None]`.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<[number, string]> = some([1, "hi"]);
	 * assert.equal(x.unzip(), [some(1), some("hi")]);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<[number, string]> = none;
	 * assert.equal(x.unzip(), [none, none]);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.unzip}
	 */
	public unzip<Value0, Value1, Exists extends boolean>(
		this: Option<readonly [Value0, Value1], Exists>,
	): [Option<Value0, Exists>, Option<Value1, Exists>] {
		// @ts-expect-error Complex types
		return this.match({
			some: ([value0, value1]) => [some(value0), some(value1)],
			none: () => [none, none],
		});
	}

	/**
	 * Swaps the nesting of an `Option` of a `Result` into a `Result` of an `Option`: `none` becomes
	 * `ok(none)`, while `some(ok(v))` and `some(err(e))` become `ok(some(v))` and `err(e)`
	 * respectively.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<Result<number, Error>> = some(ok(5));
	 * const y: Result<Option<number>, Error> = ok(some(5));
	 * assert.equal(x.transpose(), y);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.transpose}
	 */
	public transpose<
		ResultValue,
		ResultErrorValue,
		ResultSuccess extends boolean,
		Exists extends boolean,
	>(
		this: Option<Result<ResultValue, ResultErrorValue, ResultSuccess>, Exists>,
	): If<
		Exists,
		Result<Some<ResultValue>, ResultErrorValue, ResultSuccess>,
		Ok<None>
	> {
		return this.match<
			Result<Some<ResultValue>, ResultErrorValue, ResultSuccess>,
			Ok<None>
		>({
			some: (result) => result.map(some),
			none: () => ok(none),
		});
	}

	/**
	 * Collapses an `Option<Option<T>>` down to a single `Option<T>` by discarding one level of
	 * nesting.
	 *
	 * @example
	 * ```typescript
	 * const x: Option<Option<number>> = some(some(6));
	 * assert.equal(x.flatten(), some(6));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<Option<number>> = some(none);
	 * assert.equal(x.flatten(), none);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Option<Option<number>> = none;
	 * assert.equal(x.flatten(), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.flatten}
	 */
	public flatten<InnerOption extends AnyOption, Exists extends boolean>(
		this: Option<InnerOption, Exists>,
	): If<Exists, InnerOption, None> {
		return this.match({ some: (inner) => inner, none: returnThis });
	}

	/**
	 * Awaits the wrapped value when this is `Some` and resolves to a fresh `Some` wrapping the
	 * awaited value. Resolves to `none` immediately when this is `None`.
	 *
	 * @example
	 * ```typescript
	 * let x = some(Promise.resolve(3));
	 * assert.equal(await x.intoPromise(), some(3));
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public intoPromise(): Promise<Option<Awaited<T>, Exists>> {
		// @ts-expect-error Complex types
		return this.match({
			some: async (value) => some(await value),
			none: () => Promise.resolve(none),
		});
	}

	/**
	 * Reports whether `other` equals this option: both must be in the same branch (`Some`/`None`)
	 * and, when `Some`, carry strictly equal values.
	 *
	 * @param other The other option to compare against.
	 *
	 * @see {@link https://doc.rust-lang.org/std/cmp/trait.PartialEq.html#tymethod.eq}
	 */
	public eq<OtherValue extends T, OtherExists extends boolean>(
		other: Option<OtherValue, OtherExists>,
	): this is Option<OtherValue, OtherExists> {
		// @ts-expect-error Complex types
		return (
			this.isSome() === other.isSome() &&
			this[ValueSymbol] === other[ValueSymbol]
		);
	}

	/**
	 * The negation of {@link eq}.
	 *
	 * @param other The other option to compare against.
	 *
	 * @see {@link https://doc.rust-lang.org/std/cmp/trait.PartialEq.html#method.ne}
	 */
	public ne(other: Option<T, boolean>): boolean {
		return !this.eq(other);
	}

	/**
	 * Runs `branches.some` when this is `Some`, or `branches.none` when this is `None`, and returns
	 * whichever value it produced. The primary way to consume an `Option` — nearly every other
	 * method on this class is implemented in terms of it.
	 *
	 * @param branches The pair of handlers to dispatch to.
	 *
	 * @example
	 * ```typescript
	 * const option = some(4).match({
	 *   some: (v) => v,
	 *   none: () => 0
	 * });
	 * assert.equal(option, 4);
	 * ```
	 * @example
	 * ```typescript
	 * const option = none.match({
	 *   some: (v) => v,
	 *   none: () => 0
	 * });
	 * assert.equal(option, 0);
	 * ```
	 */
	public match<SomeValue, NoneValue>(branches: {
		some(this: Some<T>, value: T): SomeValue;
		none(this: None): NoneValue;
	}): If<Exists, SomeValue, NoneValue> {
		// @ts-expect-error Complex types
		return this.isSome()
			? branches.some.call(this, this[ValueSymbol])
			: branches.none.call(this);
	}

	/**
	 * Iterates the wrapped value: yields it once when this is `Some`, yields nothing when this is
	 * `None`. Backs the `for...of` protocol, so an `Option` can be spread or iterated directly.
	 *
	 * @example
	 * ```typescript
	 * const x = some(7);
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Logs 7
	 * ```
	 * @example
	 * ```typescript
	 * const x = none;
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link Option.iter}
	 * @see {@link https://doc.rust-lang.org/std/option/enum.Option.html#method.iter}
	 */
	public [Symbol.iterator](): Generator<T> {
		return this.iter();
	}

	public get [Symbol.toStringTag](): If<Exists, "Some", "None"> {
		return this.match({ some: () => "Some", none: () => "None" });
	}

	/**
	 * The single shared `None` instance. Every `Option` that carries no value is this exact object,
	 * so `None` never needs to be constructed by callers.
	 */
	public static readonly none = new Option<any, false>(null, false);

	public static some<T = undefined>(this: void, value?: T): Some<T>;
	public static some<T>(this: void, value: T): Some<T> {
		return new Option<T, true>(value, true);
	}

	/**
	 * Reports whether `instance` is an `Option`, including one produced by a different copy of this
	 * class — for example a duplicate install of this package, or a different bundle. Identity is
	 * decided by the presence of the branding symbols used internally, not by `instanceof`, so this
	 * stays correct even across realms where `instanceof Option` would otherwise fail.
	 *
	 * @param instance The value to check.
	 *
	 * @example
	 * ```typescript
	 * import { Option, some } from "@utilities/result/index.ts";
	 *
	 * some(2) instanceof Option; // true
	 * ```
	 */
	public static [Symbol.hasInstance](instance: unknown): boolean {
		return (
			typeof instance === "object" &&
			instance !== null &&
			ValueSymbol in instance &&
			ExistsSymbol in instance
		);
	}

	/**
	 * Reports whether `instance` is an `Option`, including one produced by a different copy of this
	 * class.
	 *
	 * @param instance The value to check.
	 *
	 * @example
	 * ```typescript
	 * import { Option, some } from "@utilities/result/index.ts";
	 *
	 * Option.isOption(some(2)); // true
	 * ```
	 */
	public static isOption(instance: unknown): instance is AnyOption {
		return Option[Symbol.hasInstance](instance);
	}

	/**
	 * Builds an `Option` from `operation`: a plain value, or a zero-argument callback that produces
	 * one (either directly or by returning an already-built `Option`). `null`, `undefined`, and any
	 * thrown error all resolve to `none`.
	 *
	 * @typeparam T The option's wrapped type.
	 */
	public static from<T>(
		this: void,
		operation: OptionResolvable<T> | (() => OptionResolvable<T>),
	): Option<T> {
		try {
			return resolve(isFunction(operation) ? operation() : operation);
		} catch {
			return none;
		}
	}

	/**
	 * Builds an `Option` from `operation`: an awaitable value, or a callback (sync or async) that
	 * produces one. `null`, `undefined`, and any thrown or rejected error all resolve to `none`.
	 *
	 * @typeparam T The option's wrapped type.
	 */
	public static async fromAsync<T>(
		this: void,
		operation:
			| Awaitable<OptionResolvable<T>>
			| (() => Awaitable<OptionResolvable<T>>),
	): Promise<Option<T>> {
		try {
			return resolve(await (isFunction(operation) ? operation() : operation));
		} catch {
			return none;
		}
	}

	/**
	 * Combines an array of `Option`s into a single `Some` wrapping all of their values, in order —
	 * or returns the first `None` encountered.
	 *
	 * @param options The options to combine.
	 * @returns A new `Option`.
	 */
	public static all<const Entries extends readonly AnyOption[]>(
		this: void,
		options: Entries,
	): Option<UnwrapSomeArray<Entries>> {
		const values: unknown[] = [];
		for (const option of options) {
			if (option.isNone()) return option;

			values.push(option[ValueSymbol]);
		}

		return some(values as UnwrapSomeArray<Entries>);
	}

	/**
	 * Returns the first `Some` found in an array of `Option`s, or `none` if all of them are empty.
	 *
	 * @param options The options to search.
	 * @returns A new `Option`.
	 */
	public static any<const Entries extends readonly AnyOption[]>(
		this: void,
		options: Entries,
	): Option<UnwrapSome<Entries[number]>> {
		for (const option of options) {
			if (option.isSome()) return option;
		}

		return none;
	}
}

export const { some, none } = Option;

function resolve<T>(value: OptionResolvable<T>): Option<T> {
	if (value === null || value === undefined) return none;
	if (Option.isOption(value)) return value;
	return some(value);
}
