import type { IterableResolvable } from "@types";
import { collect } from "./collect.ts";

/**
 * Drains the iterable and creates a new iterator over its elements in reverse order.
 *
 * @param iterable The iterator to reverse.
 * @returns An iterator whose elements correspond to the elements of the provided iterator in
 * reverse order.
 *
 * @example
 * ```typescript
 * console.log([...reverse([1, 2, 3, 4, 5])]);
 * // Output: [5, 4, 3, 2, 1]
 *
 * console.log([...reverse("hello")]);
 * // Output: ['o', 'l', 'l', 'e', 'h']
 * ```
 *
 * @remarks
 *
 * This function collects the entire input into an array before yielding it back in reverse.
 *
 * @since 1.0.0
 */
export function* reverse<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	const items = collect(iterable);
	for (let index = items.length - 1; index >= 0; index--) {
		yield items[index];
	}
}
