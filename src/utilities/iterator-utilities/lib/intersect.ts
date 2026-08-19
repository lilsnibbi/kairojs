import type { IterableResolvable } from "@types";
import { filter } from "./filter.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterable with the elements that are present in both input iterables.
 *
 * @param first The iterator to return elements from.
 * @param second The iterator whose elements should be kept in the result.
 *
 * @example
 * ```typescript
 * console.log([...intersect([1, 2, 3, 4, 5], [3, 4, 5, 6, 7])]);
 * // Output: [3, 4, 5]
 * ```
 *
 * @remarks
 *
 * This function consumes the entire `second` iterator to build the inclusion set.
 *
 * @see {@link difference} for the opposite behavior.
 *
 * @since 1.0.0
 */
export function intersect<const ElementType>(
	first: IterableResolvable<ElementType>,
	second: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	const set = new Set(toIterableIterator(second));
	return filter(first, (value) => set.has(value));
}
