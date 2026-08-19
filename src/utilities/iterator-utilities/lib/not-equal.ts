import type { IterableResolvable } from "@types";
import { equal } from "./equal.ts";

/**
 * Determines whether two iterables do not yield the same elements in the same order.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 * @returns Whether the two iterators are not equal.
 *
 * @example
 * ```typescript
 * console.log(notEqual([1], [1]));
 * // Output: false
 * console.log(notEqual([1], [1, 2]));
 * // Output: true
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function notEqual<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): boolean {
	return !equal(iterable, other);
}

export { notEqual as ne };
