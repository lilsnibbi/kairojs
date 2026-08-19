import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Tests whether every element in the iterable passes the given test.
 *
 * @param iterable The iterator to check.
 * @param callbackFn A function to execute for each element. It should return a truthy value to
 * indicate the element passes the test, and a falsy value otherwise.
 * @returns `true` if `callbackFn` returns a truthy value for every element, `false` otherwise.
 *
 * @example
 * ```typescript
 * const iterable = [1, 2, 3, 4, 5];
 * console.log(every(iterable, (value) => value < 10));
 * // Output: true
 *
 * console.log(every(iterable, (value) => value < 3));
 * // Output: false
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator, unless a failing element is found earlier.
 *
 * @since 1.0.0
 */
export function every<
	const ElementType,
	const FilteredType extends ElementType,
>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => element is FilteredType,
): iterable is IterableIterator<FilteredType>;
export function every<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): boolean;
export function every<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
) {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		if (!callbackFn(value, index++)) return false;
	}

	return true;
}
