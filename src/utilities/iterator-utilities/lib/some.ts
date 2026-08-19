import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Advances the iterable until an element passes the test, or it is exhausted.
 *
 * @param iterable The iterator to search.
 * @param callbackFn A function to execute for each element. It should return a truthy value to
 * indicate the element passes the test, and a falsy value otherwise.
 * @returns `true` if the callback returns a truthy value for at least one element, `false`
 * otherwise.
 *
 * @example
 * ```typescript
 * console.log(some([1, 2, 3, 4, 5], (value) => value % 2 === 0));
 * // Output: true
 *
 * console.log(some([1, 2, 3, 4, 5], (value) => value % 6 === 0));
 * // Output: false
 * ```
 *
 * @remarks
 *
 * This function consumes the iterator until a match is found or it is exhausted.
 *
 * @since 1.0.0
 */
export function some<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): boolean {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		if (callbackFn(value, index++)) {
			return true;
		}
	}

	return false;
}
