import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Advances the iterable until an element passes the test, returning its index.
 *
 * @param iterable The iterator to search.
 * @param callbackFn A function that determines if an element is the one being searched for.
 * @returns The index of the first element that satisfies the predicate, or `-1` if none do.
 *
 * @example
 * ```typescript
 * console.log(findIndex([1, 2, 3, 4, 5], (value) => value % 2 === 0));
 * // Output: 1
 * ```
 *
 * @remarks
 *
 * This function consumes the iterator until a match is found or it is exhausted.
 *
 * @since 1.0.0
 */
export function findIndex<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): number {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const element of toIterableIterator(iterable)) {
		if (callbackFn(element, index)) {
			return index;
		}

		index++;
	}

	return -1;
}
