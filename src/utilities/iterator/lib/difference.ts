import type { IterableResolvable } from "@types";
import { filter } from "./filter.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Creates an iterable with the elements of the first iterable that are not present in the second.
 *
 * @param first The iterator to return elements from.
 * @param second The iterator whose elements should be excluded from the result.
 *
 * @example
 * ```typescript
 * console.log([...difference([1, 2, 3, 4, 5], [3, 4, 5, 6, 7])]);
 * // Output: [1, 2]
 * ```
 *
 * @remarks
 *
 * This function consumes the entire `second` iterator to build the exclusion set.
 *
 * @since 1.0.0
 */
export function difference<const ElementType>(
	first: IterableResolvable<ElementType>,
	second: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	const set = new Set(toIterableIterator(second));
	return filter(first, (value) => !set.has(value));
}

export { difference as except, difference as omit };
