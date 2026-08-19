import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Drains the iterable, splitting its elements into two arrays based on a predicate.
 *
 * @param iterable The iterator to partition.
 * @param predicate A function deciding which of the two arrays an element belongs to.
 * @returns A tuple `[matched, unmatched]`: the elements that satisfied the predicate, and the
 * elements that did not.
 *
 * @example
 * ```typescript
 * const [even, odd] = partition([1, 2, 3, 4, 5], (value) => value % 2 === 0);
 *
 * console.log(even);
 * // Output: [2, 4]
 *
 * console.log(odd);
 * // Output: [1, 3, 5]
 * ```
 *
 * @remarks
 *
 * This function collects the entire input into two arrays before returning them, which may not be
 * ideal for very large iterators.
 *
 * @since 1.0.0
 */
export function partition<
	const ElementType,
	const FilteredType extends ElementType,
>(
	iterable: IterableResolvable<ElementType>,
	predicate: (value: ElementType, index: number) => value is FilteredType,
): [FilteredType[], Exclude<ElementType, FilteredType>[]];
export function partition<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	predicate: (value: ElementType, index: number) => boolean,
): [ElementType[], ElementType[]];

export function partition<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	predicate: (value: ElementType, index: number) => boolean,
): [ElementType[], ElementType[]] {
	predicate = assertFunction(predicate);

	const matched: ElementType[] = [];
	const unmatched: ElementType[] = [];

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		if (predicate(value, index++)) {
			matched.push(value);
		} else {
			unmatched.push(value);
		}
	}

	return [matched, unmatched];
}
