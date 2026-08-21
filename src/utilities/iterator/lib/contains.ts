import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Advances the iterable until it finds a value strictly equal to `value`.
 *
 * @param iterable The iterator to search.
 * @param value The value to locate in the iterator.
 * @returns `true` if the value is found in the iterator; otherwise, `false`.
 *
 * @example
 * ```typescript
 * console.log(contains([1, 2, 3, 4, 5], 3));
 * // Output: true
 * ```
 *
 * @remarks
 *
 * This function consumes the iterator until the value is found or it is exhausted.
 *
 * @since 1.0.0
 */
export function contains<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	value: ElementType,
): boolean {
	for (const element of toIterableIterator(iterable)) {
		if (element === value) return true;
	}

	return false;
}
