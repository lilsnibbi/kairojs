import type { IterableResolvable } from "@types";
import { from } from "./from.ts";

/**
 * Drains the iterable and counts how many elements it produced.
 *
 * @param iterable The iterator whose elements to count.
 * @returns The number of elements in the input iterator.
 *
 * @example
 * ```typescript
 * console.log(count([1, 2, 3, 4, 5]));
 * // Output: 5
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function count<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): number {
	let count = 0;
	const resolvedIterable = from(iterable);
	while (!resolvedIterable.next().done) {
		count++;
	}

	return count;
}
