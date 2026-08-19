import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Drains the iterable, pushing every element into an existing array.
 *
 * Useful when you already have a collection and want to append the iterator's items to it,
 * without allocating an intermediate array. The array is returned so calls can be chained.
 *
 * @param iterable The iterator whose elements to collect.
 * @param output The array to push the elements into.
 *
 * @example
 * ```typescript
 * const output: number[] = [0, 1];
 *
 * collectInto(map([1, 2, 3], (value) => value * 2), output);
 * collectInto(map([1, 2, 3], (value) => value * 10), output);
 *
 * console.log(output);
 * // Output: [0, 1, 2, 4, 6, 10, 20, 30]
 * ```
 *
 * @since 1.0.0
 */
export function collectInto<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	output: ElementType[],
): ElementType[] {
	for (const value of toIterableIterator(iterable)) {
		output.push(value);
	}

	return output;
}
