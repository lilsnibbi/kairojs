import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Advances the iterable until it finds a value strictly equal to `value`, returning its index.
 *
 * @param iterable The iterator to search.
 * @param value The value to search for.
 * @returns The index of the first occurrence of the value in the iterator, or `-1` if it is not
 * found.
 *
 * @example
 * ```typescript
 * console.log(indexOf([1, 2, 3, 4, 5], 3));
 * // Output: 2
 * ```
 *
 * @remarks
 *
 * This function consumes the iterator until the value is found or it is exhausted.
 *
 * @since 1.0.0
 */
export function indexOf<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	value: ElementType,
): number {
	let index = 0;
	for (const element of toIterableIterator(iterable)) {
		if (element === value) {
			return index;
		}

		index++;
	}

	return -1;
}
