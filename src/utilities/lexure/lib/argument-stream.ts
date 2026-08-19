import type { ArgumentStreamState, Ok, Parameter } from "@types";
import { Option, Result } from "@utilities/result/index.ts";
import type { ParserResult } from "./parser/parser-result.ts";

/**
 * Walks the ordered parameters, flags and options held by a {@link ParserResult}, tracking which
 * ordered parameters have already been consumed so each one is only handed out once.
 *
 * This is the layer the framework's `Args` class is built on: every helper below either advances
 * through the ordered parameters or reads a flag/option, and every read that can fail returns an
 * {@link Option} or a {@link Result} instead of throwing.
 *
 * @since 1.0.0
 */
export class ArgumentStream {
	/**
	 * The parsed parameters, flags and options this stream reads from.
	 */
	public readonly results: ParserResult;

	/**
	 * The current progress through {@link ArgumentStream.results}. Save and restore it with
	 * {@link ArgumentStream.save} and {@link ArgumentStream.restore} to roll back a failed attempt at
	 * parsing.
	 */
	public state: ArgumentStreamState;

	/**
	 * @param results The parsed parameters, flags and options to read from.
	 */
	public constructor(results: ParserResult) {
		this.results = results;
		this.state = { used: new Set(), position: 0 };
	}

	/**
	 * Whether every ordered parameter has been consumed.
	 */
	public get finished(): boolean {
		return this.used === this.length;
	}

	/**
	 * The total number of ordered parameters.
	 */
	public get length(): number {
		return this.results.ordered.length;
	}

	/**
	 * The number of ordered parameters not yet consumed.
	 */
	public get remaining(): number {
		return this.length - this.used;
	}

	/**
	 * The number of ordered parameters already consumed.
	 */
	public get used(): number {
		return this.state.used.size;
	}

	/**
	 * Retrieves the value of the next unused ordered parameter.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '1 2 3':
	 *
	 * console.log(stream.single());
	 * // Some { value: '1' }
	 *
	 * console.log(stream.single());
	 * // Some { value: '2' }
	 *
	 * console.log(stream.single());
	 * // Some { value: '3' }
	 *
	 * console.log(stream.single());
	 * // None
	 * ```
	 *
	 * @returns The value, if any parameter remains.
	 */
	public single(): Option<string> {
		if (this.finished) return Option.none;

		while (this.state.used.has(this.state.position)) {
			++this.state.position;
		}

		this.state.used.add(this.state.position);
		return Option.some(this.results.ordered[this.state.position++]!.value);
	}

	/**
	 * Retrieves the value of the next unused ordered parameter, but only if it can be transformed.
	 *
	 * @note This has no asynchronous counterpart support built in — see {@link singleMapAsync}.
	 *
	 * @example
	 * ```typescript
	 * const parseNumber = (value: string) => {
	 *   const number = Number(value);
	 *   return Number.isNaN(number) ? Option.none : Option.some(number);
	 * };
	 *
	 * // Assume the input is '1 2 3':
	 *
	 * console.log(stream.singleMap(parseNumber));
	 * // Some { value: 1 }
	 *
	 * console.log(stream.singleMap(parseNumber));
	 * // Some { value: 2 }
	 *
	 * console.log(stream.singleMap(parseNumber));
	 * // Some { value: 3 }
	 *
	 * console.log(stream.singleMap(parseNumber));
	 * // None
	 * ```
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Transforms the parameter's value, or reports failure by returning `none`.
	 * @param useAnyways Whether to consume the parameter even when the transform fails. Defaults to
	 * `false`.
	 * @returns The transformed value, if any.
	 */
	public singleMap<T>(
		predicate: (value: string) => Option<T>,
		useAnyways = false,
	): Option<T> {
		if (this.finished) return Option.none;

		while (this.state.used.has(this.state.position)) {
			++this.state.position;
		}

		const result = predicate(this.results.ordered[this.state.position]!.value);
		if (result.isSome() || useAnyways) {
			this.state.used.add(this.state.position);
			++this.state.position;
		}

		return result;
	}

	/**
	 * Retrieves the value of the next unused ordered parameter, but only if it can be transformed.
	 *
	 * @note This is the asynchronous counterpart to {@link singleMap}.
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Transforms the parameter's value, or reports failure by returning `none`.
	 * @param useAnyways Whether to consume the parameter even when the transform fails. Defaults to
	 * `false`.
	 * @returns The transformed value, if any.
	 */
	public async singleMapAsync<T>(
		predicate: (value: string) => Promise<Option<T>>,
		useAnyways = false,
	): Promise<Option<T>> {
		if (this.finished) return Option.none;

		while (this.state.used.has(this.state.position)) {
			++this.state.position;
		}

		const result = await predicate(
			this.results.ordered[this.state.position]!.value,
		);
		if (result.isSome() || useAnyways) {
			this.state.used.add(this.state.position);
			++this.state.position;
		}

		return result;
	}

	/**
	 * Retrieves and transforms the next unused ordered parameter, keeping the failure reason around.
	 *
	 * @note This is a variant of {@link singleMap} that returns the failure instead of discarding it.
	 * @note This has no asynchronous counterpart support built in — see {@link singleParseAsync}.
	 *
	 * @example
	 * ```typescript
	 * const parseNumber = (value: string) => {
	 *   const number = Number(value);
	 *   return Number.isNaN(number) ? Result.err(`Could not parse ${value} to a number`) : Result.ok(number);
	 * };
	 *
	 * // Assume the input is '1 2 3':
	 *
	 * console.log(stream.singleParse(parseNumber));
	 * // Ok { value: 1 }
	 *
	 * console.log(stream.singleParse(parseNumber));
	 * // Ok { value: 2 }
	 *
	 * console.log(stream.singleParse(parseNumber));
	 * // Ok { value: 3 }
	 *
	 * console.log(stream.singleParse(parseNumber));
	 * // Err { error: null }
	 * ```
	 *
	 * @typeparam T The transformed value's type.
	 * @typeparam E The failure type.
	 * @param predicate Transforms the parameter's value, or reports failure with an `Err`.
	 * @param useAnyways Whether to consume the parameter even when the transform fails. Defaults to
	 * `false`.
	 * @returns The transformed value, or `Err(null)` once no parameters remain.
	 */
	public singleParse<T, E>(
		predicate: (value: string) => Result<T, E>,
		useAnyways = false,
	): Result<T, E | null> {
		if (this.finished) return Result.err(null);

		while (this.state.used.has(this.state.position)) {
			++this.state.position;
		}

		const result = predicate(this.results.ordered[this.state.position]!.value);
		if (result.isOk() || useAnyways) {
			this.state.used.add(this.state.position);
			++this.state.position;
		}

		return result;
	}

	/**
	 * Retrieves and transforms the next unused ordered parameter, keeping the failure reason around.
	 *
	 * @note This is the asynchronous counterpart to {@link singleParse}.
	 *
	 * @typeparam T The transformed value's type.
	 * @typeparam E The failure type.
	 * @param predicate Transforms the parameter's value, or reports failure with an `Err`.
	 * @param useAnyways Whether to consume the parameter even when the transform fails. Defaults to
	 * `false`.
	 * @returns The transformed value, or `Err(null)` once no parameters remain.
	 */
	public async singleParseAsync<T, E>(
		predicate: (value: string) => Promise<Result<T, E>>,
		useAnyways = false,
	): Promise<Result<T, E | null>> {
		if (this.finished) return Result.err(null);

		while (this.state.used.has(this.state.position)) {
			++this.state.position;
		}

		const result = await predicate(
			this.results.ordered[this.state.position]!.value,
		);
		if (result.isOk() || useAnyways) {
			this.state.used.add(this.state.position);
			++this.state.position;
		}

		return result;
	}

	/**
	 * Finds the first unused ordered parameter whose value satisfies the given predicate.
	 *
	 * @note This has no asynchronous counterpart support built in — see {@link findAsync}.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is 'ba aa cc':
	 *
	 * console.log(stream.find((value) => value.startsWith('a')));
	 * // Some { value: 'aa' }
	 * ```
	 *
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `true`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first matching value, if any.
	 */
	public find(
		predicate: (value: string) => boolean,
		from = this.state.position,
	): Option<string> {
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			if (predicate(value)) {
				this.state.used.add(index);
				return Option.some(value);
			}
		}

		return Option.none;
	}

	/**
	 * Finds the first unused ordered parameter whose value satisfies the given predicate.
	 *
	 * @note This is the asynchronous counterpart to {@link find}.
	 *
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `true`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first matching value, if any.
	 */
	public async findAsync(
		predicate: (value: string) => Promise<boolean>,
		from = this.state.position,
	): Promise<Option<string>> {
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			if (await predicate(value)) {
				this.state.used.add(index);
				return Option.some(value);
			}
		}

		return Option.none;
	}

	/**
	 * Finds the first unused ordered parameter that can be transformed.
	 *
	 * @note This has no asynchronous counterpart support built in — see {@link findMapAsync}.
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `Some`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first transformed value, if any.
	 */
	public findMap<T>(
		predicate: (value: string) => Option<T>,
		from = this.state.position,
	): Option<T> {
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = predicate(value);
			if (result.isSome()) {
				this.state.used.add(index);
				return result;
			}
		}

		return Option.none;
	}

	/**
	 * Finds the first unused ordered parameter that can be transformed.
	 *
	 * @note This is the asynchronous counterpart to {@link findMap}.
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `Some`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first transformed value, if any.
	 */
	public async findMapAsync<T>(
		predicate: (value: string) => Promise<Option<T>>,
		from = this.state.position,
	): Promise<Option<T>> {
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = await predicate(value);
			if (result.isSome()) {
				this.state.used.add(index);
				return result;
			}
		}

		return Option.none;
	}

	/**
	 * Finds the first unused ordered parameter that can be transformed, keeping every failure reason
	 * collected along the way.
	 *
	 * @note This is a variant of {@link findMap} that returns the errors on failure.
	 * @note This has no asynchronous counterpart support built in — see {@link findParseAsync}.
	 *
	 * @example
	 * ```typescript
	 * const parseNumber = (value: string) => {
	 *   const number = Number(value);
	 *   return Number.isNaN(number) ? Result.err(`Could not parse ${value} to a number`) : Result.ok(number);
	 * };
	 *
	 * // Assume the input is 'ba 1 cc':
	 *
	 * console.log(stream.findParse(parseNumber));
	 * // Ok { value: 1 }
	 *
	 * console.log(stream.findParse(parseNumber));
	 * // Err { error: ['Could not parse ba to a number', 'Could not parse cc to a number'] }
	 * ```
	 *
	 * @typeparam T The transformed value's type.
	 * @typeparam E The failure type.
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `Ok`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first transformed value, or every collected failure if none matched.
	 */
	public findParse<T, E>(
		predicate: (value: string) => Result<T, E>,
		from = this.state.position,
	): Result<T, E[]> {
		const errors: E[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = predicate(value);
			if (result.isOk()) {
				this.state.used.add(index);
				return result as Ok<T>;
			}

			errors.push(result.unwrapErr());
		}

		return Result.err(errors);
	}

	/**
	 * Finds the first unused ordered parameter that can be transformed, keeping every failure reason
	 * collected along the way.
	 *
	 * @note This is a variant of {@link findMapAsync} that returns the errors on failure.
	 * @note This is the asynchronous counterpart to {@link findParse}.
	 *
	 * @typeparam T The transformed value's type.
	 * @typeparam E The failure type.
	 * @param predicate Called once per unused parameter, in ascending order, until it returns `Ok`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The first transformed value, or every collected failure if none matched.
	 */
	public async findParseAsync<T, E>(
		predicate: (value: string) => Promise<Result<T, E>>,
		from = this.state.position,
	): Promise<Result<T, E[]>> {
		const errors: E[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = await predicate(value);
			if (result.isOk()) {
				this.state.used.add(index);
				return result as Ok<T>;
			}

			errors.push(result.unwrapErr());
		}

		return Result.err(errors);
	}

	/**
	 * Retrieves multiple unused ordered parameters at once.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '1 2 3':
	 *
	 * console.log(join(stream.many().unwrap()));
	 * // '1 2 3'
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '1 2 3':
	 *
	 * console.log(join(stream.many(2).unwrap()));
	 * // '1 2'
	 * ```
	 *
	 * @param limit The maximum number of parameters to retrieve. Defaults to `Infinity`.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns The retrieved parameters, if at least one was available.
	 */
	public many(
		limit = Infinity,
		from = this.state.position,
	): Option<Parameter[]> {
		if (this.finished) return Option.none;

		const parameters: Parameter[] = [];
		for (let index = from; index < this.length; ++index) {
			// Skip parameters already consumed:
			if (this.state.used.has(index)) continue;

			// Mark the parameter as used and collect it:
			this.state.used.add(index);
			parameters.push(this.results.ordered[index]!);

			// Stop once the limit has been reached:
			if (parameters.length >= limit) break;
		}

		return parameters.length ? Option.some(parameters) : Option.none;
	}

	/**
	 * Retrieves the value of every unused ordered parameter whose value satisfies the given
	 * predicate.
	 *
	 * @param predicate Called once per unused parameter, in ascending order.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns Every matching value. Always `Some`, even when empty, unless the stream is finished.
	 */
	public filter(
		predicate: (value: string) => boolean,
		from = this.state.position,
	): Option<string[]> {
		if (this.finished) return Option.none;

		const parameters: string[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			if (predicate(value)) {
				this.state.used.add(index);
				parameters.push(value);
			}
		}

		return Option.some(parameters);
	}

	/**
	 * Retrieves the value of every unused ordered parameter whose value satisfies the given
	 * predicate.
	 *
	 * @note This is the asynchronous counterpart to {@link filter}.
	 *
	 * @param predicate Called once per unused parameter, in ascending order.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns Every matching value. Always `Some`, even when empty, unless the stream is finished.
	 */
	public async filterAsync(
		predicate: (value: string) => Promise<boolean>,
		from = this.state.position,
	): Promise<Option<string[]>> {
		if (this.finished) return Option.none;

		const parameters: string[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			if (await predicate(value)) {
				this.state.used.add(index);
				parameters.push(value);
			}
		}

		return Option.some(parameters);
	}

	/**
	 * Retrieves every unused ordered parameter that can be transformed.
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Called once per unused parameter, in ascending order.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns Every transformed value. Always `Some`, even when empty, unless the stream is finished.
	 */
	public filterMap<T>(
		predicate: (value: string) => Option<T>,
		from = this.state.position,
	): Option<T[]> {
		if (this.finished) return Option.none;

		const parameters: T[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = predicate(value);
			result.inspect((transformed) => {
				this.state.used.add(index);
				parameters.push(transformed);
			});
		}

		return Option.some(parameters);
	}

	/**
	 * Retrieves every unused ordered parameter that can be transformed.
	 *
	 * @note This is the asynchronous counterpart to {@link filterMap}.
	 *
	 * @typeparam T The transformed value's type.
	 * @param predicate Called once per unused parameter, in ascending order.
	 * @param from The position to start scanning from. Defaults to the current position.
	 * @returns Every transformed value. Always `Some`, even when empty, unless the stream is finished.
	 */
	public async filterMapAsync<T>(
		predicate: (value: string) => Promise<Option<T>>,
		from = this.state.position,
	): Promise<Option<T[]>> {
		if (this.finished) return Option.none;

		const parameters: T[] = [];
		for (let index = from; index < this.length; ++index) {
			if (this.state.used.has(index)) continue;

			const value = this.results.ordered[index]!.value;
			const result = await predicate(value);
			result.inspect((transformed) => {
				this.state.used.add(index);
				parameters.push(transformed);
			});
		}

		return Option.some(parameters);
	}

	/**
	 * Checks whether any of the given flags were given.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '--f --g':
	 *
	 * console.log(stream.flag('f'));
	 * // true
	 *
	 * console.log(stream.flag('g', 'h'));
	 * // true
	 *
	 * console.log(stream.flag('h'));
	 * // false
	 * ```
	 *
	 * @param keys The flag names to check.
	 * @returns Whether any of the flags were given.
	 */
	public flag(...keys: readonly string[]): boolean {
		return keys.some((key) => this.results.flags.has(key));
	}

	/**
	 * Retrieves the last value given to any of the named options. When multiple names are given, the
	 * last value of the last name that was found wins.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '--a=1 --b=2 --c=3':
	 *
	 * console.log(stream.option('a'));
	 * // Some { value: '1' }
	 *
	 * console.log(stream.option('b', 'c'));
	 * // Some { value: '3' }
	 *
	 * console.log(stream.option('d'));
	 * // None
	 * ```
	 *
	 * @param keys The option names to check.
	 * @returns The last value, if any of the options were given.
	 */
	public option(...keys: readonly string[]): Option<string> {
		return this.options(...keys).map((values) => values.at(-1)!);
	}

	/**
	 * Retrieves every value given to any of the named options.
	 *
	 * @example
	 * ```typescript
	 * // Assume the input is '--a=1 --a=1 --b=2 --c=3':
	 *
	 * console.log(stream.options('a'));
	 * // Some { value: ['1', '1'] }
	 *
	 * console.log(stream.options('b', 'c'));
	 * // Some { value: ['2', '3'] }
	 *
	 * console.log(stream.options('d'));
	 * // None
	 * ```
	 *
	 * @param keys The option names to check.
	 * @returns Every value across the given options, concatenated in order, if any were given.
	 */
	public options(...keys: readonly string[]): Option<readonly string[]> {
		const entries: string[] = [];
		for (const key of keys) {
			const values = this.results.options.get(key);
			if (values) entries.push(...values);
		}

		return entries.length ? Option.some(entries) : Option.none;
	}

	/**
	 * Captures the current progress through the ordered parameters, for later use with
	 * {@link ArgumentStream.restore}.
	 */
	public save(): ArgumentStreamState {
		return {
			used: new Set(this.state.used),
			position: this.state.position,
		};
	}

	/**
	 * Replaces the current progress with a state previously captured by
	 * {@link ArgumentStream.save}.
	 *
	 * @param state The state to restore.
	 */
	public restore(state: ArgumentStreamState): void {
		this.state = state;
	}

	/**
	 * Resets progress back to the start, as if nothing had been consumed yet.
	 */
	public reset(): void {
		this.restore({ used: new Set(), position: 0 });
	}
}
