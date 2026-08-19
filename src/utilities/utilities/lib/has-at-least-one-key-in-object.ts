import { isNullish } from "./is-null-or-undefined.ts";

/**
 * Checks whether any of the given keys is an own property of an object.
 *
 * @param object The object to check.
 * @param keys The keys to look for.
 * @returns `true` if at least one of `keys` is an own property of `object`.
 *
 * @example
 * ```typescript
 * const values = { a: 1, b: 2, c: 3 };
 * hasAtLeastOneKeyInObject(values, ["a"]); // true
 * hasAtLeastOneKeyInObject(values, ["d"]); // false
 * ```
 *
 * @since 1.0.0
 */
export function hasAtLeastOneKeyInObject<
	T extends object,
	K extends PropertyKey,
>(object: T, keys: readonly K[]): object is T & { [key in K]-?: unknown } {
	return !isNullish(object) && keys.some((key) => Object.hasOwn(object, key));
}
