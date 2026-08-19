import type { CompareByComparator, IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import {
	compareIteratorElements,
	orderingIsLess,
} from "./shared/compare-elements.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Returns the element that compares as the maximum according to a custom comparator.
 *
 * If several elements are equally maximum, the last one is returned. An empty iterator returns
 * `null`.
 *
 * @param iterable The iterator to find the maximum element of.
 * @param comparator The comparator used to rank elements.
 * @returns The maximum element, or `null` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(maxBy([-3, 0, 1, 5, -10], ascNumber));
 * // Output: 5
 * ```
 *
 * @see {@link max} for a version that uses the default comparator.
 * @see {@link maxByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function maxBy<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	comparator: CompareByComparator<ElementType>,
): ElementType | null {
	comparator = assertFunction(comparator);

	const iterator = toIterableIterator(iterable);
	const first = iterator.next();
	if (first.done) return null;

	let maximum = first.value;
	for (const value of iterator) {
		const comparison = compareIteratorElements<ElementType>(
			value,
			maximum,
			comparator,
		);
		if (!orderingIsLess(comparison)) {
			maximum = value;
		}
	}

	return maximum;
}
