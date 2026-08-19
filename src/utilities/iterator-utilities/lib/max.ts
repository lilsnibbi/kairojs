import type { IterableResolvable } from "@types";
import { maxBy } from "./max-by.ts";
import { defaultCompare } from "./shared/comparators.ts";

/**
 * Returns the greatest element of the iterable according to the default, string-converted
 * comparator. An empty iterator returns `null`.
 *
 * @param iterable The iterator to find the maximum element of.
 * @returns The maximum element, or `null` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(max([1, 2, 3, 4, 5]));
 * // Output: 5
 * ```
 *
 * @see {@link maxBy} for a version that accepts a custom comparator.
 * @see {@link maxByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function max<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): ElementType | null {
	return maxBy(iterable, defaultCompare);
}
