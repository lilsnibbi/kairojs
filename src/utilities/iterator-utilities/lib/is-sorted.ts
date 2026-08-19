import type { IterableResolvable } from "@types";
import { isSortedBy } from "./is-sorted-by.ts";
import { defaultCompare } from "./shared/comparators.ts";

/**
 * Checks whether the iterable's elements are sorted in ascending order according to the default,
 * string-converted comparator.
 *
 * @param iterable The iterator to check.
 *
 * @example
 * ```typescript
 * console.log(isSorted([1, 2, 2, 9]));
 * // Output: true
 * console.log(isSorted([1, 3, 2, 4]));
 * // Output: false
 * console.log(isSorted([]));
 * // Output: true
 * ```
 *
 * @see {@link isSortedBy} for a version that accepts a custom comparator.
 * @see {@link isSortedByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function isSorted<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): boolean {
	return isSortedBy(iterable, defaultCompare);
}
