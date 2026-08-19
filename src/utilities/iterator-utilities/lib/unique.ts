import type { IterableResolvable } from "@types";
import { union } from "./union.ts";

/**
 * Creates an iterable with the duplicate elements of the input removed.
 *
 * Implemented as {@link union} of a single iterable, since union already deduplicates as it goes.
 *
 * @param iterable The iterator to remove duplicates from.
 * @returns An iterator that yields the values of the provided iterator with duplicates removed.
 *
 * @example
 * ```typescript
 * console.log([...unique([1, 2, 2, 3, 3, 3, 4, 4, 4, 4])]);
 * // Output: [1, 2, 3, 4]
 * ```
 *
 * @since 1.0.0
 */
export function unique<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	return union(iterable);
}
