import type {
	AnyResult,
	Awaitable,
	Err,
	If,
	None,
	Ok,
	ResultResolvable,
	SafeTryOptions,
	Some,
	UnwrapOk,
	UnwrapOkArray,
	UnwrapErrArray,
} from "@types";
import { none, some, type Option } from "./option.ts";
import { ResultError } from "./errors.ts";
import { isFunction, returnThis } from "./internal.ts";

const ValueSymbol = Symbol.for("kairo:result.value");
const SuccessSymbol = Symbol.for("kairo:result.success");

/**
 * The symbol behind `Result#unwrapSafe`'s generator getter. `Result.safeTry` hands it out as the
 * `$` helper so a generator body can write `yield* someResult[$]` to emulate Rust's `?` operator.
 *
 * It is exported only so {@link SafeTryOptions} can reference its type — treat it as an
 * implementation detail of `safeTry`, not something to read or call directly.
 *
 * @since 1.0.0
 */
export const ResultUnwrapSafeSymbol = Symbol.for("kairo:result.safeUnwrap");

/**
 * Represents a computation that either succeeded with a value or failed with an error, without
 * relying on exceptions to communicate the failure. A `Result` is always either `Ok`, carrying a
 * success value, or `Err`, carrying an error value — never both, never neither.
 *
 * `ok()` and `err()` are the two constructors: `ok(value)` builds an `Ok`, `err(error)` builds an
 * `Err`. Every instance method below narrows or transforms the wrapped value while keeping track,
 * at the type level, of which branch it is.
 *
 * @typeparam T The type of the wrapped success value.
 * @typeparam E The type of the wrapped error value.
 *
 * @see {@link https://doc.rust-lang.org/std/result/index.html}
 *
 * @since 1.0.0
 */
export class Result<T, E, const Success extends boolean = boolean> {
	/**
	 * Branded field that pins `Success` to its exact literal type instead of letting it widen to
	 * `boolean`. Never assigned, never read — its only job is to appear in the type.
	 * @internal
	 */
	protected declare __STATUS__: Success;

	private readonly [ValueSymbol]: If<Success, T, E>;
	private readonly [SuccessSymbol]: Success;

	private constructor(value: If<Success, T, E>, success: Success) {
		this[ValueSymbol] = value;
		this[SuccessSymbol] = success;
	}

	/**
	 * Reports whether this result is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(-3);
	 * assert.equal(x.isOk(), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Some error message");
	 * assert.equal(x.isOk(), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.is_ok}
	 */
	public isOk(): this is Ok<T, E> {
		return this[SuccessSymbol];
	}

	/**
	 * Reports whether this result is `Ok` and its value satisfies `predicate`.
	 *
	 * @param predicate Checked against the wrapped value when this is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.equal(x.isOkAnd((value) => value > 1), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x = ok(0);
	 * assert.equal(x.isOkAnd((value) => value > 1), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Some error message");
	 * assert.equal(x.isOkAnd((value) => value > 1), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.is_ok_and}
	 */
	public isOkAnd<Refined extends T>(
		predicate: (value: T) => value is Refined,
	): this is Ok<Refined, E>;
	public isOkAnd<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): this is Ok<T, E> & Matched;
	public isOkAnd<Matched extends boolean>(
		predicate: (value: T) => Matched,
	): this is Ok<T, E> & Matched {
		return this.isOk() && predicate(this[ValueSymbol]);
	}

	/**
	 * Reports whether this result is `Err`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(-3);
	 * assert.equal(x.isErr(), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Some error message");
	 * assert.equal(x.isErr(), true);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.is_err}
	 */
	public isErr(): this is Err<E, T> {
		return !this[SuccessSymbol];
	}

	/**
	 * Reports whether this result is `Err` and its error satisfies `predicate`.
	 *
	 * @param predicate Checked against the wrapped error when this is `Err`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.equal(x.isErrAnd((error) => error instanceof TypeError), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err(new Error("Some error message"));
	 * assert.equal(x.isErrAnd((error) => error instanceof TypeError), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err(new TypeError("Some error message"));
	 * assert.equal(x.isErrAnd((error) => error instanceof TypeError), true);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.is_err_and}
	 */
	public isErrAnd<Refined extends E>(
		predicate: (error: E) => error is Refined,
	): this is Err<Refined, T>;
	public isErrAnd<Matched extends boolean>(
		predicate: (error: E) => Matched,
	): this is Err<E, T> & Matched;
	public isErrAnd<Matched extends boolean>(
		predicate: (error: E) => Matched,
	): this is Err<E, T> & Matched {
		return this.isErr() && predicate(this[ValueSymbol]);
	}

	/**
	 * Converts this `Result<T, E>` into an `Option<T>`, keeping the success value and discarding the
	 * error, if any.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.ok(), some(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.ok(), none);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.ok}
	 */
	public ok(): If<Success, Some<T>, None> {
		return this.match({ ok: (value) => some(value), err: () => none });
	}

	/**
	 * Converts this `Result<T, E>` into an `Option<E>`, keeping the error and discarding the success
	 * value, if any.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.err(), none);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.err(), "Some error message");
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.err}
	 */
	public err(): If<Success, None, Some<E>> {
		return this.match({ ok: () => none, err: (error) => some(error) });
	}

	/**
	 * Runs `transform` on the wrapped value when this is `Ok`, rewrapping its return value in a new
	 * `Ok`. An `Err` passes through untouched.
	 *
	 * @param transform Applied to the success value.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.map((value) => value * 2), ok(4));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.map((value) => value * 2), err("Some error message"));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.map}
	 */
	public map<OutputValue>(
		transform: (value: If<Success, T, never>) => OutputValue,
	): Result<OutputValue, E, Success> {
		// @ts-expect-error Complex types
		return this.match({ ok: (value) => ok(transform(value)), err: returnThis });
	}

	/**
	 * Runs `transform` on the wrapped value when this is `Ok`, returning whatever `Result` it
	 * produces directly instead of rewrapping it in another `Ok`. An `Err` passes through untouched.
	 * Useful for chaining a step that can itself fail.
	 *
	 * @param transform Applied to the success value; returns the replacement `Result`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.mapInto((value) => ok(value * value)), ok(4));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(0);
	 * assert.equal(
	 *   x.mapInto((value) => (value === 0 ? err("zero is not divisible") : ok(1 / value))),
	 *   err("zero is not divisible")
	 * );
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.mapInto((value) => ok(4)), err("Some error message"));
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public mapInto<OutputResult extends AnyResult>(
		transform: (value: If<Success, T, never>) => OutputResult,
	): If<Success, OutputResult, Err<E>> {
		return this.match({ ok: (value) => transform(value), err: returnThis });
	}

	/**
	 * Resolves to `defaultValue` when this is `Err`, or to `transform` applied to the wrapped value
	 * when this is `Ok`.
	 *
	 * `defaultValue` is evaluated eagerly even when this is `Ok` — reach for {@link mapOrElse} to
	 * defer that computation to a closure instead.
	 *
	 * @param defaultValue Returned as-is when this is `Err`.
	 * @param transform Applied to the success value when this is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok("hello");
	 * assert.equal(x.mapOr(42, (value) => value.length), 5);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Some error message");
	 * assert.equal(x.mapOr(42, (value) => value.length), 42);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.map_or}
	 */
	public mapOr<MappedOutputValue, DefaultOutputValue>(
		defaultValue: DefaultOutputValue,
		transform: (value: If<Success, T, never>) => MappedOutputValue,
	): If<Success, MappedOutputValue, DefaultOutputValue> {
		return this.match({
			ok: (value) => transform(value),
			err: () => defaultValue,
		});
	}

	/**
	 * Resolves to `onErr` applied to the wrapped error when this is `Err`, or `onOk` applied to the
	 * wrapped value when this is `Ok`. Lets a caller unwrap a result and handle its failure branch in
	 * one expression.
	 *
	 * @param onErr Applied to the error when this is `Err`.
	 * @param onOk Applied to the value when this is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<string, string> = ok("hello");
	 * assert.equal(x.mapOrElse((error) => error.length, (value) => value.length), 5);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<string, string> = err("Some error message");
	 * assert.equal(x.mapOrElse((error) => error.length, (value) => value.length), 18);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.map_or_else}
	 */
	public mapOrElse<OutputValue, OutputError>(
		onErr: (error: If<Success, never, E>) => OutputError,
		onOk: (value: If<Success, T, never>) => OutputValue,
	): If<Success, OutputValue, OutputError> {
		return this.match({
			ok: (value) => onOk(value),
			err: (error) => onErr(error),
		});
	}

	/**
	 * Runs `transform` on the wrapped error when this is `Err`, rewrapping its return value in a new
	 * `Err`. An `Ok` passes through untouched. Useful for translating an error type while leaving a
	 * successful value alone.
	 *
	 * @param transform Applied to the error value.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, Error> = ok(2);
	 * assert.equal(x.mapErr((error) => error.message), ok(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, Error> = err(new Error("Some error message"));
	 * assert.equal(x.mapErr((error) => error.message), err("Some error message"));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.map_err}
	 */
	public mapErr<OutputError>(
		transform: (error: If<Success, never, E>) => OutputError,
	): Result<T, OutputError, Success> {
		// @ts-expect-error Complex types
		return this.match({
			ok: returnThis,
			err: (error) => err(transform(error)),
		});
	}

	/**
	 * Runs `transform` on the wrapped error when this is `Err`, returning whatever `Result` it
	 * produces directly instead of rewrapping it in another `Err`. An `Ok` passes through untouched.
	 * Useful for chaining a recovery step that can itself fail.
	 *
	 * @param transform Applied to the error value; returns the replacement `Result`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, Error> = ok(2);
	 * assert.equal(x.mapErrInto((error) => err(error.message)), ok(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, Error> = err(new Error("Some error message"));
	 * assert.equal(x.mapErrInto((error) => err(error.message)), err("Some error message"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, Error> = err(new Error("Some error message"));
	 * assert.equal(x.mapErrInto((error) => ok(4)), ok(4));
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public mapErrInto<OutputResult extends AnyResult>(
		transform: (error: If<Success, never, E>) => OutputResult,
	): If<Success, Ok<T>, OutputResult> {
		return this.match({ ok: returnThis, err: (error) => transform(error) });
	}

	/**
	 * Runs `callback` with the wrapped value when this is `Ok`, purely for its side effect, and
	 * returns this same result unchanged either way.
	 *
	 * @param callback Called with the success value.
	 * @seealso {@link inspectAsync} for the awaitable version.
	 *
	 * @example
	 * ```typescript
	 * ok(2).inspect(console.log);
	 * // Logs: 2
	 * ```
	 * @example
	 * ```typescript
	 * err("Some error message").inspect(console.log);
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.inspect}
	 */
	public inspect(callback: (value: T) => unknown): this {
		if (this.isOk()) callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Runs `callback` with the wrapped value when this is `Ok` and awaits it before resolving,
	 * returning this same result unchanged either way.
	 *
	 * @param callback Called with the success value; may return a promise.
	 * @seealso {@link inspect} for the synchronous version.
	 *
	 * @example
	 * ```typescript
	 * await ok(2).inspectAsync(console.log);
	 * // Logs: 2
	 * ```
	 * @example
	 * ```typescript
	 * await err("Some error message").inspectAsync(console.log);
	 * // Doesn't log
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public async inspectAsync(
		callback: (value: T) => Awaitable<unknown>,
	): Promise<this> {
		if (this.isOk()) await callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Runs `callback` with the wrapped error when this is `Err`, purely for its side effect, and
	 * returns this same result unchanged either way.
	 *
	 * @param callback Called with the error value.
	 * @seealso {@link inspectErrAsync} for the awaitable version.
	 *
	 * @example
	 * ```typescript
	 * ok(2).inspectErr(console.log);
	 * // Doesn't log
	 * ```
	 * @example
	 * ```typescript
	 * err("Some error message").inspectErr(console.log);
	 * // Logs: Some error message
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.inspect_err}
	 */
	public inspectErr(callback: (error: E) => unknown): this {
		if (this.isErr()) callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Runs `callback` with the wrapped error when this is `Err` and awaits it before resolving,
	 * returning this same result unchanged either way.
	 *
	 * @param callback Called with the error value; may return a promise.
	 * @seealso {@link inspectErr} for the synchronous version.
	 *
	 * @example
	 * ```typescript
	 * await ok(2).inspectErrAsync(console.log);
	 * // Doesn't log
	 * ```
	 * @example
	 * ```typescript
	 * await err("Some error message").inspectErrAsync(console.log);
	 * // Logs: Some error message
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public async inspectErrAsync(
		callback: (error: E) => Awaitable<unknown>,
	): Promise<this> {
		if (this.isErr()) await callback(this[ValueSymbol]);
		return this;
	}

	/**
	 * Iterates the wrapped value: yields it once when this is `Ok`, yields nothing when this is
	 * `Err`.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(7);
	 * for (const value of x.iter()) {
	 *   console.log(value);
	 * }
	 * // Logs 7
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Nothing!");
	 * for (const value of x.iter()) {
	 *   console.log(value);
	 * }
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.iter}
	 */
	public *iter(): Generator<T> {
		if (this.isOk()) yield this[ValueSymbol];
	}

	/**
	 * Returns the wrapped success value, or throws a {@link ResultError} carrying `message` and the
	 * wrapped error when this is `Err`.
	 *
	 * @param message The message the thrown error should carry.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.equal(x.expect("Whoops!"), 2);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Emergency failure");
	 * assert.throws(() => x.expect("Whoops!"), {
	 *   name: "ResultError",
	 *   message: "Whoops",
	 *   value: "Emergency failure"
	 * });
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.expect}
	 */
	public expect(message: string): If<Success, T, never> {
		if (this.isErr()) throw new ResultError(message, this[ValueSymbol]);
		return this[ValueSymbol] as If<Success, T, never>;
	}

	/**
	 * Returns the wrapped error, or throws a {@link ResultError} carrying `message` and the wrapped
	 * success value when this is `Ok`.
	 *
	 * @param message The message the thrown error should carry.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.throws(() => x.expectErr("Whoops!"), {
	 *   name: "ResultError",
	 *   message: "Whoops",
	 *   value: 2
	 * });
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Emergency failure");
	 * assert.equal(x.expectErr("Whoops!"), "Emergency failure");
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.expect_err}
	 */
	public expectErr(message: string): If<Success, never, E> {
		if (this.isOk()) throw new ResultError(message, this[ValueSymbol]);
		return this[ValueSymbol] as If<Success, never, E>;
	}

	/**
	 * Returns the wrapped success value, or throws a {@link ResultError} with a generic message and
	 * the wrapped error when this is `Err`.
	 *
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapOrElse}
	 * @seealso {@link unwrapErr}
	 * @seealso {@link unwrapRaw}
	 * @seealso {@link unwrapSafe}
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.equal(x.unwrap(), 2);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Emergency failure");
	 * assert.throws(() => x.unwrap(), {
	 *   name: "ResultError",
	 *   message: "Unwrap failed",
	 *   value: "Emergency failure"
	 * });
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap}
	 */
	public unwrap(): If<Success, T, never> {
		if (this.isErr()) throw new ResultError("Unwrap failed", this[ValueSymbol]);
		return this[ValueSymbol] as If<Success, T, never>;
	}

	/**
	 * Returns the wrapped error, or throws a {@link ResultError} with a generic message and the
	 * wrapped success value when this is `Ok`.
	 *
	 * @seealso {@link unwrap}
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapOrElse}
	 * @seealso {@link unwrapRaw}
	 * @seealso {@link unwrapSafe}
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.throws(() => x.unwrapErr(), {
	 *   name: "ResultError",
	 *   message: "Unwrap failed",
	 *   value: 2
	 * });
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Emergency failure");
	 * assert.equal(x.unwrapErr(), "Emergency failure");
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap_err}
	 */
	public unwrapErr(): If<Success, never, E> {
		if (this.isOk()) throw new ResultError("Unwrap failed", this[ValueSymbol]);
		return this[ValueSymbol] as If<Success, never, E>;
	}

	/**
	 * Returns the wrapped success value, or `defaultValue` when this is `Err`.
	 *
	 * `defaultValue` is evaluated eagerly even when this is `Ok` — reach for {@link unwrapOrElse} to
	 * defer that computation to a closure instead.
	 *
	 * @seealso {@link unwrap}
	 * @seealso {@link unwrapOrElse}
	 * @seealso {@link unwrapErr}
	 * @seealso {@link unwrapRaw}
	 * @seealso {@link unwrapSafe}
	 *
	 * @param defaultValue Returned when this is `Err`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(9);
	 * assert.equal(x.unwrapOr(2), 9);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Error");
	 * assert.equal(x.unwrapOr(2), 2);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap_or}
	 */
	public unwrapOr<OutputValue>(
		defaultValue: OutputValue,
	): If<Success, T, OutputValue> {
		return this.match({ ok: (value) => value, err: () => defaultValue });
	}

	/**
	 * Returns the wrapped success value, or the result of calling `onErr` with the wrapped error when
	 * this is `Err`.
	 *
	 * @seealso {@link unwrap}
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapErr}
	 * @seealso {@link unwrapRaw}
	 * @seealso {@link unwrapSafe}
	 *
	 * @param onErr Computes the fallback value from the error.
	 *
	 * @example
	 * ```typescript
	 * const count = (x: string) => x.length;
	 *
	 * assert.equal(ok(2).unwrapOrElse(count), 2);
	 * assert.equal(err("hello").unwrapOrElse(count), 5);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap_or_else}
	 */
	public unwrapOrElse<OutputValue>(
		onErr: (error: E) => OutputValue,
	): If<Success, T, OutputValue> {
		return this.match({ ok: (value) => value, err: (error) => onErr(error) });
	}

	/**
	 * Returns the wrapped success value, or throws the wrapped error itself (not a {@link ResultError})
	 * when this is `Err`.
	 *
	 * @seealso {@link unwrap}
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapOrElse}
	 * @seealso {@link unwrapErr}
	 * @seealso {@link unwrapSafe}
	 *
	 * @example
	 * ```typescript
	 * const x = ok(2);
	 * assert.equal(x.unwrapRaw(), 2);
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Emergency failure");
	 * assert.throws(() => x.unwrapRaw(), {
	 *   name: "Error",
	 *   message: "Unwrap failed",
	 *   value: "Emergency failure"
	 * });
	 * ```
	 */
	public unwrapRaw(): If<Success, T, never> {
		if (this.isErr()) throw this[ValueSymbol];
		// @ts-expect-error Complex types
		return this[ValueSymbol] as T;
	}

	/**
	 * Returns the wrapped success value, or yields this result (as an `Err`) and never returns.
	 * Emulates Rust's `?` operator inside a {@link Result.safeTry} generator body: `yield* result[$]`
	 * either produces the success value or bails the whole generator out with the `Err`.
	 *
	 * Calling this outside of a `safeTry` body drives the generator to its first `yield`, throwing a
	 * {@link ResultError} instead of short-circuiting a caller that was never there.
	 *
	 * @seealso {@link unwrap}
	 * @seealso {@link unwrapOr}
	 * @seealso {@link unwrapErr}
	 * @seealso {@link unwrapRaw}
	 *
	 * @see {@link Result.safeTry}
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap_safe}
	 */
	public *unwrapSafe(): Generator<Err<E, T>, T> {
		if (this.isOk()) {
			return this[ValueSymbol];
		}

		yield this as Err<E, T>;
		throw new ResultError(
			"Should not be used outside of a safe try generator",
			this[ValueSymbol],
		);
	}

	/**
	 * Returns `result` when this is `Ok`, otherwise returns this same `Err` unchanged.
	 *
	 * @param result The result to return in place of this one when this is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * const y: Result<string, string> = err("Late error");
	 * assert.equal(x.and(y), err("Late error"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Early error");
	 * const y: Result<string, string> = err("Late error");
	 * assert.equal(x.and(y), err("Early error"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * const y: Result<string, string> = ok("Hello");
	 * assert.equal(x.and(y), ok("Hello"));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.and}
	 */
	public and<OutputResult extends AnyResult>(
		result: OutputResult,
	): If<Success, OutputResult, Err<E>> {
		return this.match({ ok: () => result, err: returnThis });
	}

	/**
	 * Runs `transform` with the wrapped value when this is `Ok`, returning whatever `Result` it
	 * produces. Otherwise returns this same `Err` unchanged. Chains a fallible step onto a successful
	 * result.
	 *
	 * @param transform Applied to the success value; returns the next `Result` in the chain.
	 *
	 * @example
	 * ```typescript
	 * function fractionOf4(value: number) {
	 *   return value === 0 ? err("overflowed") : ok(4 / value);
	 * }
	 *
	 * assert.equal(ok(2).andThen(fractionOf4), ok(4));
	 * assert.equal(ok(0).andThen(fractionOf4), err("overflowed"));
	 * assert.equal(err("not a number").andThen(fractionOf4), err("not a number"));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.and_then}
	 */
	public andThen<OutputResult extends AnyResult>(
		transform: (value: T) => OutputResult,
	): OutputResult {
		// @ts-expect-error Complex types
		return this.match({ ok: (value) => transform(value), err: returnThis });
	}

	/**
	 * Returns `result` when this is `Err`, otherwise returns this same `Ok` unchanged.
	 *
	 * `result` is evaluated eagerly even when this is `Ok` — reach for {@link orElse} to defer that
	 * computation to a closure instead.
	 *
	 * @param result The result to return in place of this one when this is `Err`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * const y: Result<number, string> = err("Late error");
	 * assert.equal(x.or(y), ok(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Early error");
	 * const y: Result<number, string> = ok(2);
	 * assert.equal(x.or(y), ok(2));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Early error");
	 * const y: Result<number, string> = err("Late error");
	 * assert.equal(x.or(y), err("Late error"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * const y: Result<number, string> = ok(100);
	 * assert.equal(x.or(y), ok(2));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.or}
	 */
	public or<OutputResult extends AnyResult>(
		result: OutputResult,
	): If<Success, Ok<T>, OutputResult> {
		return this.match({ ok: returnThis, err: () => result });
	}

	/**
	 * Runs `transform` with the wrapped error when this is `Err`, returning whatever `Result` it
	 * produces. Otherwise returns this same `Ok` unchanged. Chains a recovery step onto a failed
	 * result.
	 *
	 * @param transform Applied to the error value; returns the replacement `Result`.
	 *
	 * @example
	 * ```typescript
	 * const square = (x: number): Result<number, string> => ok(x * x);
	 * const wrapErr = (x: number): Result<number, string> => err(x);
	 *
	 * assert.equal(ok(2).orElse(square).orElse(square), ok(2));
	 * assert.equal(ok(2).orElse(wrapErr).orElse(square), ok(2));
	 * assert.equal(err(3).orElse(square).orElse(wrapErr), ok(9));
	 * assert.equal(err(3).orElse(wrapErr).orElse(wrapErr), err(3));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.or_else}
	 */
	public orElse<OutputResult extends AnyResult>(
		transform: (error: E) => OutputResult,
	): If<Success, Ok<T>, OutputResult> {
		return this.match({ ok: returnThis, err: (error) => transform(error) });
	}

	/**
	 * Reports whether this is an `Ok` whose value strictly equals `value`.
	 *
	 * @param value The value to compare against.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.contains(2), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(3);
	 * assert.equal(x.contains(2), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.contains(2), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.contains}
	 */
	public contains<const Value extends T>(
		this: Ok<T>,
		value: Value,
	): this is Ok<Value>;
	public contains(this: Err<E>, value: T): false;
	public contains(value: T): boolean {
		return this.isOkAnd((inner) => inner === value);
	}

	/**
	 * Reports whether this is an `Err` whose error strictly equals `error`.
	 *
	 * @param error The error to compare against.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = ok(2);
	 * assert.equal(x.containsErr("Some error message"), false);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some error message");
	 * assert.equal(x.containsErr("Some error message"), true);
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = err("Some other error message");
	 * assert.equal(x.containsErr("Some error message"), false);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.contains_err}
	 */
	public containsErr(this: Ok<T>, error: E): false;
	public containsErr<const Value extends E>(
		this: Err<E>,
		error: Value,
	): this is Err<Value>;
	public containsErr(error: E): boolean {
		return this.isErrAnd((inner) => inner === error);
	}

	/**
	 * Swaps the nesting of a `Result` of an `Option` into an `Option` of a `Result`: `ok(none)`
	 * becomes `none`, while `ok(some(v))` and `err(e)` become `some(ok(v))` and `some(err(e))`
	 * respectively.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<Option<number>, Error> = ok(some(5));
	 * const y: Option<Result<number, Error>> = some(ok(5));
	 * assert.equal(x.transpose(), y);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.transpose}
	 */
	public transpose<InnerValue>(
		this: Result<Option<InnerValue>, E, Success>,
	): If<Success, Option<Ok<InnerValue>>, Some<Err<E>>> {
		return this.match({
			ok: (value) => value.map((value) => ok(value)),
			err() {
				return some(this);
			},
		});
	}

	/**
	 * Collapses a `Result<Result<T, E>, E>` down to a single `Result<T, E>` by discarding one level
	 * of nesting.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<Result<string, number>, number> = ok(ok("Hello"));
	 * assert.equal(x.flatten(), ok("Hello"));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<Result<string, number>, number> = ok(err(6));
	 * assert.equal(x.flatten(), err(6));
	 * ```
	 * @example
	 * ```typescript
	 * const x: Result<Result<string, number>, number> = err(6);
	 * assert.equal(x.flatten(), err(6));
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.flatten}
	 */
	public flatten<InnerResult extends AnyResult>(
		this: Result<InnerResult, E, Success>,
	): If<Success, InnerResult, Err<E>> {
		return this.match({ ok: (value) => value, err: returnThis });
	}

	/**
	 * Returns the wrapped value regardless of which branch this result is in: the success value for
	 * `Ok`, the error value for `Err`. Only meaningful once `T` and `E` have converged to the same
	 * type.
	 *
	 * @example
	 * ```typescript
	 * let x: Result<number, number> = ok(3);
	 * assert.equal(x.intoOkOrErr(), 3);
	 * ```
	 * @example
	 * ```typescript
	 * let x: Result<number, number> = err(4);
	 * assert.equal(x.intoOkOrErr(), 4);
	 * ```
	 *
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.into_ok_or_err}
	 */
	public intoOkOrErr(): If<Success, T, E> {
		return this[ValueSymbol];
	}

	/**
	 * Awaits the wrapped value (if `Ok`) or the wrapped error (if `Err`) and resolves to a fresh
	 * `Result` built from the awaited value, keeping the same `Ok`/`Err` branch.
	 *
	 * @example
	 * ```typescript
	 * let x = ok(Promise.resolve(3));
	 * assert.equal(await x.intoPromise(), ok(3));
	 * ```
	 *
	 * @note This is an extension not supported in Rust.
	 */
	public intoPromise(): Promise<If<Success, Ok<Awaited<T>>, Err<Awaited<E>>>> {
		// @ts-expect-error Complex types
		return this.match<Ok<Awaited<T>>, Err<Awaited<E>>>({
			// @ts-expect-error Complex types
			ok: async (value) => ok(await value),
			// @ts-expect-error Complex types
			err: async (error) => err(await error),
		});
	}

	/**
	 * Reports whether `other` equals this result: both must be in the same branch (`Ok`/`Err`) and
	 * carry strictly equal values.
	 *
	 * @param other The other result to compare against.
	 *
	 * @see {@link https://doc.rust-lang.org/std/cmp/trait.PartialEq.html#tymethod.eq}
	 */
	public eq<
		OtherValue extends T,
		OtherError extends E,
		OtherSuccess extends boolean,
	>(
		other: Result<OtherValue, OtherError, OtherSuccess>,
	): this is Result<OtherValue, OtherError, OtherSuccess> {
		if (this.isOk() !== other.isOk()) return false;
		// @ts-expect-error Complex types: both are confirmed the same branch above.
		return this[ValueSymbol] === other[ValueSymbol];
	}

	/**
	 * The negation of {@link eq}.
	 *
	 * @param other The other result to compare against.
	 *
	 * @see {@link https://doc.rust-lang.org/std/cmp/trait.PartialEq.html#method.ne}
	 */
	public ne(other: Result<T, E>): boolean {
		return !this.eq(other);
	}

	/**
	 * Runs `branches.ok` when this is `Ok`, or `branches.err` when this is `Err`, and returns
	 * whichever value it produced. The primary way to consume a `Result` — nearly every other method
	 * on this class is implemented in terms of it.
	 *
	 * @param branches The pair of handlers to dispatch to.
	 *
	 * @example
	 * ```typescript
	 * const result = ok(4).match({
	 *   ok: (v) => v,
	 *   err: () => 0
	 * });
	 * assert.equal(result, 4);
	 * ```
	 * @example
	 * ```typescript
	 * const result = err("Hello").match({
	 *   ok: (v) => v,
	 *   err: () => 0
	 * });
	 * assert.equal(result, 0);
	 * ```
	 */
	public match<OkValue, ErrValue>(branches: {
		ok(this: Ok<T>, value: If<Success, T, never>): OkValue;
		err(this: Err<E>, error: If<Success, never, E>): ErrValue;
	}): If<Success, OkValue, ErrValue> {
		const result = this.isOk()
			? branches.ok.call(
					this as unknown as Ok<T>,
					this[ValueSymbol] as unknown as If<Success, T, never>,
				)
			: branches.err.call(
					this as unknown as Err<E>,
					this[ValueSymbol] as unknown as If<Success, never, E>,
				);
		return result as If<Success, OkValue, ErrValue>;
	}

	/**
	 * Iterates the wrapped value: yields it once when this is `Ok`, yields nothing when this is
	 * `Err`. Backs the `for...of` protocol, so a `Result` can be spread or iterated directly.
	 *
	 * @example
	 * ```typescript
	 * const x = ok(7);
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Logs 7
	 * ```
	 * @example
	 * ```typescript
	 * const x = err("Nothing!");
	 * for (const value of x) {
	 *   console.log(value);
	 * }
	 * // Doesn't log
	 * ```
	 *
	 * @see {@link Result.iter}
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.iter}
	 */
	public [Symbol.iterator](): Generator<T> {
		return this.iter();
	}

	public get [Symbol.toStringTag](): If<Success, "Ok", "Err"> {
		return this.match({ ok: () => "Ok", err: () => "Err" });
	}

	/**
	 * Backs `result[$]` inside a {@link Result.safeTry} generator body, emulating Rust's `?`
	 * operator.
	 *
	 * @see {@link Result.safeTry}
	 * @see {@link https://doc.rust-lang.org/std/result/enum.Result.html#method.safeTry}
	 */
	public get [ResultUnwrapSafeSymbol](): Generator<Err<E, T>, T> {
		return this.unwrapSafe();
	}

	public static ok<T = undefined, E = any>(this: void, value?: T): Ok<T, E>;
	public static ok<T, E = any>(this: void, value: T): Ok<T, E> {
		return new Result<T, E, true>(value, true);
	}

	public static err<E = undefined, T = any>(this: void, value?: E): Err<E, T>;
	public static err<E, T = any>(this: void, value: E): Err<E, T> {
		return new Result<T, E, false>(value, false);
	}

	/**
	 * Reports whether `instance` is a `Result`, including one produced by a different copy of this
	 * class — for example a duplicate install of this package, or a different bundle. Identity is
	 * decided by the presence of the branding symbols used internally, not by `instanceof`, so this
	 * stays correct even across realms where `instanceof Result` would otherwise fail.
	 *
	 * @param instance The value to check.
	 *
	 * @example
	 * ```typescript
	 * import { Result, ok } from "@utilities/result/index.ts";
	 *
	 * ok(2) instanceof Result; // true
	 * ```
	 */
	public static [Symbol.hasInstance](instance: unknown): boolean {
		return (
			typeof instance === "object" &&
			instance !== null &&
			ValueSymbol in instance &&
			SuccessSymbol in instance
		);
	}

	/**
	 * Reports whether `instance` is a `Result`, including one produced by a different copy of this
	 * class.
	 *
	 * @param instance The value to check.
	 *
	 * @example
	 * ```typescript
	 * import { Result, ok } from "@utilities/result/index.ts";
	 *
	 * Result.isResult(ok(2)); // true
	 * ```
	 */
	public static isResult(instance: unknown): instance is AnyResult {
		return Result[Symbol.hasInstance](instance);
	}

	/**
	 * Builds a `Result` from `operation`: a plain value, or a zero-argument callback that produces
	 * one (either directly or by returning an already-built `Result`). If evaluating `operation`
	 * throws, the thrown value is captured as `Err` instead of propagating.
	 *
	 * @typeparam T The result's success type.
	 * @typeparam E The result's error type.
	 */
	public static from<T, E = unknown>(
		this: void,
		operation: ResultResolvable<T, E> | (() => ResultResolvable<T, E>),
	): Result<T, E> {
		try {
			return resolve(isFunction(operation) ? operation() : operation);
		} catch (error) {
			return err(error as E);
		}
	}

	/**
	 * Builds a `Result` from `operation`: an awaitable value, or a callback (sync or async) that
	 * produces one. If awaiting `operation` throws or rejects, that value is captured as `Err`
	 * instead of propagating.
	 *
	 * @typeparam T The result's success type.
	 * @typeparam E The result's error type.
	 */
	public static async fromAsync<T, E = unknown>(
		this: void,
		operation:
			| Awaitable<ResultResolvable<T, E>>
			| (() => Awaitable<ResultResolvable<T, E>>),
	): Promise<Result<T, E>> {
		try {
			return resolve(await (isFunction(operation) ? operation() : operation));
		} catch (error) {
			return err(error as E);
		}
	}

	/**
	 * Combines an array of `Result`s into a single `Ok` wrapping all of their success values, in
	 * order — or returns the first `Err` encountered.
	 *
	 * @param results The results to combine.
	 * @returns A new `Result`.
	 */
	public static all<const Entries extends readonly AnyResult[]>(
		this: void,
		results: Entries,
	): Result<UnwrapOkArray<Entries>, UnwrapErrArray<Entries>[number]> {
		const values: unknown[] = [];
		for (const result of results) {
			if (result.isErr()) return result;

			values.push(result[ValueSymbol]);
		}

		return ok(values as UnwrapOkArray<Entries>);
	}

	/**
	 * Returns the first `Ok` found in an array of `Result`s, or, if every one of them failed, an
	 * `Err` wrapping all of their error values, in order.
	 *
	 * @param results The results to search.
	 * @returns A new `Result`.
	 */
	public static any<const Entries extends readonly AnyResult[]>(
		this: void,
		results: Entries,
	): Result<UnwrapOk<Entries[number]>, UnwrapErrArray<Entries>> {
		const errors: unknown[] = [];
		for (const result of results) {
			if (result.isOk()) return result;

			errors.push(result[ValueSymbol]);
		}

		return err(errors as UnwrapErrArray<Entries>);
	}

	/**
	 * Runs a generator function to completion, returning either the `Result` it eventually `return`s
	 * or the first `Err` it `yield`s — whichever happens first. Combined with the `$`/`$async`
	 * helpers passed to the generator, this emulates Rust's `?` operator: `yield* result[$]` bails
	 * the whole generator out as soon as it hits an `Err`.
	 *
	 * @example
	 * ```typescript
	 * const result = Result.safeTry(function* ({ $ }) {
	 *   const first = yield* ok(1)[$];
	 *   const second = yield* ok(1)[$];
	 *
	 *   return ok(first + second);
	 * });
	 *
	 * result.match({
	 *   ok: (value) => value, // 2
	 *   err: (error) => {}
	 * });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * const resultAsync = Result.safeTry(async function* ({ $async }) {
	 *   const first = yield* $async(Result.fromAsync(() => Promise.resolve(1)));
	 *   const second = yield* ok(1)[$];
	 *
	 *   return ok(first + second);
	 * });
	 *
	 * resultAsync.match({
	 *   ok: (value) => value, // 2
	 *   err: (error) => {}
	 * });
	 * ```
	 * @param body What is evaluated. Inside it, `yield* result[$]` works like Rust's `result?`
	 * expression.
	 * @returns The first `Err` yielded, or the `Result` eventually returned.
	 */
	public static safeTry<T, E>(
		body: (options: SafeTryOptions) => Generator<Err<E>, Result<T, E>>,
	): Result<T, E>;

	/**
	 * Runs an async generator function to completion, returning either the `Result` it eventually
	 * `return`s or the first `Err` it `yield`s — whichever happens first. Combined with the
	 * `$`/`$async` helpers passed to the generator, this emulates Rust's `?` operator: `yield*
	 * result[$]` bails the whole generator out as soon as it hits an `Err`.
	 *
	 * @example
	 * ```typescript
	 * const result = Result.safeTry(function* ({ $ }) {
	 *   const first = yield* ok(1)[$];
	 *   const second = yield* ok(1)[$];
	 *
	 *   return ok(first + second);
	 * });
	 *
	 * result.match({
	 *   ok: (value) => value, // 2
	 *   err: (error) => {}
	 * });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * const resultAsync = Result.safeTry(async function* ({ $async }) {
	 *   const first = yield* $async(Result.fromAsync(() => Promise.resolve(1)));
	 *   const second = yield* ok(1)[$];
	 *
	 *   return ok(first + second);
	 * });
	 *
	 * resultAsync.match({
	 *   ok: (value) => value, // 2
	 *   err: (error) => {}
	 * });
	 * ```
	 * @param body What is evaluated. Inside it, `yield* result[$]` works like Rust's `result?`
	 * expression.
	 * @returns The first `Err` yielded, or the `Result` eventually returned.
	 */
	public static safeTry<T, E>(
		body: (options: SafeTryOptions) => AsyncGenerator<Err<E>, Result<T, E>>,
	): Promise<Result<T, E>>;
	public static safeTry<T, E>(
		body:
			| ((options: SafeTryOptions) => Generator<Err<E>, Result<T, E>>)
			| ((options: SafeTryOptions) => AsyncGenerator<Err<E>, Result<T, E>>),
	): Result<T, E> | Promise<Result<T, E>> {
		const step = body({
			$: ResultUnwrapSafeSymbol,
			$async: unwrapSafeAsync,
		}).next();
		if (step instanceof Promise) {
			return step.then((resolved) => resolved.value);
		}

		return step.value;
	}
}

export const { ok, err } = Result;

function resolve<T, E>(value: ResultResolvable<T, E>): Result<T, E> {
	return Result.isResult(value) ? value : ok(value);
}

async function* unwrapSafeAsync<T, E>(
	result: Promise<Result<T, E>>,
): AsyncGenerator<Err<E>, T> {
	const awaited = await result;
	return yield* awaited.unwrapSafe();
}
