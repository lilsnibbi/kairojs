import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterable that yields every element of every inner iterable, in order.
 *
 * @param iterables The iterable of iterables to flatten.
 * @returns An iterator that yields the entries of each inner iterator.
 *
 * @example
 * ```typescript
 * console.log([...flat([[1, 2], [3, 4], [5, 6]])]);
 * // Output: [1, 2, 3, 4, 5, 6]
 * ```
 *
 * @since 1.0.0
 */
export function* flat<const ElementType>(
	iterables: IterableResolvable<IterableResolvable<ElementType>>,
): IterableIterator<ElementType> {
	for (const value of toIterableIterator(iterables)) {
		yield* toIterableIterator(value);
	}
}
