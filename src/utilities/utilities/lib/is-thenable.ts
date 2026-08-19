import type { Thenable } from "@types";
import { isFunction } from "./is-function.ts";

// biome-ignore lint/complexity/noBannedTypes: only callability of `then` is checked
function hasThen(input: { then?: Function }): boolean {
	return Reflect.has(input, "then") && isFunction(input.then);
}

// biome-ignore lint/complexity/noBannedTypes: only callability of `catch` is checked
function hasCatch(input: { catch?: Function }): boolean {
	return Reflect.has(input, "catch") && isFunction(input.catch);
}

/**
 * Checks whether a value behaves like a promise: either a real `Promise` instance, or any object
 * exposing both `then` and `catch` methods.
 *
 * @param input The value to check.
 *
 * @since 1.0.0
 */
export function isThenable(input: unknown): input is Thenable {
	if (typeof input !== "object" || input === null) return false;
	return (
		input instanceof Promise ||
		(input !== Promise.prototype && hasThen(input) && hasCatch(input))
	);
}
