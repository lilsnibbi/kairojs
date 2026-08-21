import type { IterableResolvable } from "@types";
import { from } from "./from.ts";

/**
 * Pulls a single value from the front of the iterable.
 *
 * @param iterable The iterator to return the first value of.
 * @returns The first value of the iterator, or `undefined` if the iterator is empty.
 *
 * @example
 * ```typescript
 * const iterable = [1, 2, 3, 4, 5];
 * console.log(first(iterable));
 * // Output: 1
 * ```
 *
 * @remarks
 *
 * This function consumes only the first value of the iterator, leaving the rest untouched.
 *
 * @since 1.0.0
 */
export function first<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): ElementType | undefined {
	return from(iterable).next().value;
}
