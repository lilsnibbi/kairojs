import type { IterableResolvable } from "@types";
import { minBy } from "./min-by.ts";
import { defaultCompare } from "./shared/comparators.ts";

/**
 * Returns the smallest element of the iterable according to the default, string-converted
 * comparator. An empty iterator returns `null`.
 *
 * @param iterable The iterator to find the minimum element of.
 * @returns The minimum element, or `null` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(min([1, 2, 3, 4, 5]));
 * // Output: 1
 * ```
 *
 * @see {@link minBy} for a version that accepts a custom comparator.
 * @see {@link minByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function min<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): ElementType | null {
	return minBy(iterable, defaultCompare);
}
