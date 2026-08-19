import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterable that yields only the elements for which the callback returns a truthy
 * value.
 *
 * @param iterable The iterator to filter.
 * @param callbackFn A function to execute for each element. It should return a truthy value to
 * keep the element, and a falsy value to drop it.
 * @returns An iterator that produces elements from the given iterator that satisfy the test.
 *
 * @example
 * ```typescript
 * const iterable = [1, 2, 3, 4, 5];
 * console.log([...filter(iterable, (value) => value % 2 === 0)]);
 * // Output: [2, 4]
 * ```
 *
 * @since 1.0.0
 */
export function filter<
	const ElementType,
	const FilteredType extends ElementType,
>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => element is FilteredType,
): IterableIterator<FilteredType>;
export function filter<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): IterableIterator<ElementType>;
export function* filter<ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): IterableIterator<ElementType> {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		if (callbackFn(value, index++)) yield value;
	}
}
