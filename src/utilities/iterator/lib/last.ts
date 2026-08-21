import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Drains the iterable and returns its final element.
 *
 * @param iterable The iterator to return the last value of.
 * @returns The last value produced, or `undefined` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(last([1, 2, 3, 4, 5]));
 * // Output: 5
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator to find the last value.
 *
 * @since 1.0.0
 */
export function last<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): ElementType | undefined {
	let lastValue: ElementType | undefined;
	for (const value of toIterableIterator(iterable)) {
		lastValue = value;
	}

	return lastValue;
}
