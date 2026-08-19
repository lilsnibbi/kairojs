/**
 * Narrows `input` down to a callable function.
 *
 * `Result.from`, `Result.fromAsync`, `Option.from` and `Option.fromAsync` all accept either a
 * plain value or a zero-argument callback that produces one; this is how they tell the two apart
 * at runtime.
 *
 * @param input The value to check.
 *
 * @since 1.0.0
 */
export function isFunction<Args extends readonly any[], Return>(
	input: (...args: Args) => Return,
): true;
export function isFunction(
	input: any,
): input is (...args: readonly any[]) => any;
export function isFunction(input: any) {
	return typeof input === "function";
}

/**
 * Narrows `input` down to a promise-like (thenable) value.
 *
 * @param input The value to check.
 *
 * @since 1.0.0
 */
export function isPromise<Value>(input: PromiseLike<Value>): true;
export function isPromise(input: any): input is PromiseLike<any>;
export function isPromise(input: any) {
	return (
		typeof input === "object" &&
		input !== null &&
		typeof input.then === "function"
	);
}

/**
 * Returns the calling instance unchanged.
 *
 * Used as the "leave it alone" branch of a `match` call — for example, `Result#map` passes this as
 * the `err` branch so that mapping an `Err` value is a no-op instead of needing its own closure.
 *
 * @since 1.0.0
 */
export function returnThis<Self>(this: Self): Self {
	return this;
}
