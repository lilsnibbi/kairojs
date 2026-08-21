import type { IterableResolvable } from "@types";
import { toArray } from "./toArray.ts";

/**
 * Drains the iterable and returns a new iterator over its elements in sorted order.
 *
 * @param iterable The iterator to sort.
 * @param compareFn A function that defines the sort order. If omitted, the values are sorted in
 * ascending, string-converted order — the same default {@link Array.prototype.sort} uses.
 * @returns An iterator that yields the values of the provided iterator in sorted order.
 *
 * @example
 * ```typescript
 * console.log([...sorted([5, 3, 1, 4, 2])]);
 * // Output: [1, 2, 3, 4, 5]
 * ```
 *
 * @remarks
 *
 * This function consumes the entire input iterator.
 *
 * @since 1.0.0
 */
export function sorted<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	compareFn?: (a: ElementType, b: ElementType) => number,
): IterableIterator<ElementType> {
	return toArray(iterable).sort(compareFn).values();
}
