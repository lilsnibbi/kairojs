import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Creates an iterable with the deduplicated elements of every given iterable, in order.
 *
 * @param iterables The iterators to combine.
 * @returns An iterator that yields the union of the provided iterators.
 *
 * @example
 * ```typescript
 * console.log([...union([1, 2, 3], [3, 4, 5])]);
 * // Output: [1, 2, 3, 4, 5]
 * ```
 *
 * @since 1.0.0
 */
export function* union<const ElementType>(
	...iterables: IterableResolvable<ElementType>[]
): IterableIterator<ElementType> {
	const seen = new Set<ElementType>();
	for (const iterator of iterables) {
		for (const value of toIterableIterator(iterator)) {
			if (!seen.has(value)) {
				seen.add(value);
				yield value;
			}
		}
	}
}
