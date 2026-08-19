import type { Option } from "@utilities/result/lib/option.ts";

export type { Option, Result };
import type {
	Result,
	ResultUnwrapSafeSymbol,
} from "@utilities/result/lib/result.ts";

/**
 * A {@link Result} that is known, at the type level, to be successful.
 *
 * @since 1.0.0
 */
export type Ok<T, E = any> = Result<T, E, true>;

/**
 * A {@link Result} that is known, at the type level, to have failed.
 *
 * @since 1.0.0
 */
export type Err<E, T = any> = Result<T, E, false>;

/**
 * Any {@link Result}, regardless of whether it succeeded.
 *
 * @since 1.0.0
 */
export type AnyResult = Result<any, any>;

/**
 * Something that `Result.from`/`Result.fromAsync` can turn into a {@link Result}: either a plain
 * value, which becomes `Ok`, or an already-built `Result`, which passes through unchanged.
 *
 * @since 1.0.0
 */
export type ResultResolvable<T, E = any, Success extends boolean = boolean> =
	| T
	| Result<T, E, Success>;

/**
 * Extracts the success type out of a {@link Result}.
 *
 * @since 1.0.0
 */
export type UnwrapOk<T extends AnyResult> =
	T extends Ok<infer Value> ? Value : never;

/**
 * Extracts the error type out of a {@link Result}.
 *
 * @since 1.0.0
 */
export type UnwrapErr<T extends AnyResult> =
	T extends Err<infer Value> ? Value : never;

/**
 * Maps a tuple of {@link Result}s to a tuple of their success types, preserving position. Used by
 * {@link Result.all} to type the combined array.
 *
 * @since 1.0.0
 */
export type UnwrapOkArray<T extends readonly AnyResult[] | []> = {
	-readonly [Index in keyof T]: UnwrapOk<T[Index]>;
};

/**
 * Maps a tuple of {@link Result}s to a tuple of their error types, preserving position. Used by
 * {@link Result.any} to type the combined array.
 *
 * @since 1.0.0
 */
export type UnwrapErrArray<T extends readonly AnyResult[] | []> = {
	-readonly [Index in keyof T]: UnwrapErr<T[Index]>;
};

/**
 * The two helpers handed to the generator function passed to {@link Result.safeTry}, letting its
 * body emulate Rust's `?` operator.
 *
 * `$` unwraps a synchronous `Result` by yielding its `Err` (bailing out of the generator early) and
 * evaluating to its `Ok` value otherwise: `const value = yield* someResult[$];`. `$async` does the
 * same for a `Promise<Result<T, E>>`.
 *
 * @since 1.0.0
 */
export interface SafeTryOptions {
	$: typeof ResultUnwrapSafeSymbol;
	$async: <T, E>(result: Promise<Result<T, E>>) => AsyncGenerator<Err<E>, T>;
}

/**
 * An {@link Option} that is known, at the type level, to hold a value.
 *
 * @since 1.0.0
 */
export type Some<T> = Option<T, true>;

/**
 * An {@link Option} that is known, at the type level, to be empty.
 *
 * @since 1.0.0
 */
export type None<T = any> = Option<T, false>;

/**
 * Any {@link Option}, regardless of whether it holds a value.
 *
 * @since 1.0.0
 */
export type AnyOption = Option<any>;

/**
 * Something that `Option.from`/`Option.fromAsync` can turn into an {@link Option}: `null` and
 * `undefined` become `none`, an already-built `Option` passes through unchanged, and anything else
 * becomes `Some`.
 *
 * @since 1.0.0
 */
export type OptionResolvable<T, Exists extends boolean = boolean> =
	| T
	| null
	| undefined
	| Option<T, Exists>;

/**
 * Extracts the held type out of an {@link Option}.
 *
 * @since 1.0.0
 */
export type UnwrapSome<T extends AnyOption> =
	T extends Some<infer Value> ? Value : never;

/**
 * Maps a tuple of {@link Option}s to a tuple of their held types, preserving position. Used by
 * {@link Option.all} to type the combined array.
 *
 * @since 1.0.0
 */
export type UnwrapSomeArray<T extends readonly AnyOption[] | []> = {
	-readonly [Index in keyof T]: UnwrapSome<T[Index]>;
};
