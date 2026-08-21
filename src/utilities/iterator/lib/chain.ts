import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Creates an iterator that yields the values of every given iterable, one after another.
 *
 * @param iterables The iterators to chain together.
 * @returns An iterator that yields the values of the provided iterators in order.
 *
 * @example
 * ```typescript
 * console.log([...chain([1, 2, 3], [4, 5, 6], [7, 8, 9])]);
 * // Output: [1, 2, 3, 4, 5, 6, 7, 8, 9]
 * ```
 *
 * @since 1.0.0
 */
export function* chain<const ElementType>(
	...iterables: IterableResolvable<ElementType>[]
): IterableIterator<ElementType> {
	for (const iterable of iterables) {
		yield* toIterableIterator(iterable);
	}
}
