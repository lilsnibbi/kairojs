import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterable that drops every leading element that passes the test, then yields the rest
 * unchanged (including any later elements that would also have passed).
 *
 * @param iterable The iterator to drop values from.
 * @param callbackFn A function to execute for each element. Elements are dropped while it returns
 * a truthy value.
 * @returns An iterator over the elements of `iterable` starting from the first one that fails the
 * test.
 *
 * @example
 * ```typescript
 * console.log([...dropWhile([1, 2, 3, 4, 5], (value) => value < 3)]);
 * // Output: [3, 4, 5]
 * ```
 *
 * @see {@link filter} or {@link takeWhile} for the opposite behavior.
 *
 * @since 1.0.0
 */
export function dropWhile<
	const ElementType,
	const FilteredType extends ElementType,
>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => element is FilteredType,
): IterableIterator<Exclude<ElementType, FilteredType>>;
export function dropWhile<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): IterableIterator<ElementType>;
export function* dropWhile<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): IterableIterator<ElementType> {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		if (!callbackFn(value, index++)) {
			yield value;
		}
	}
}
