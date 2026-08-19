import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Drains the iterable into a plain array.
 *
 * @param iterable The iterator to convert to an array.
 * @returns An array containing the values of the provided iterator.
 *
 * @example
 * ```typescript
 * console.log(toArray([1, 2, 3, 4, 5]));
 * // Output: [1, 2, 3, 4, 5]
 *
 * console.log(toArray(new Set([1, 2, 3])));
 * // Output: [1, 2, 3]
 *
 * console.log(toArray("hello"));
 * // Output: ['h', 'e', 'l', 'l', 'o']
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function toArray<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): ElementType[] {
	return [...toIterableIterator(iterable)];
}
