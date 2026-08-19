import type { CompareByComparator, IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import {
	compareIteratorElements,
	orderingIsGreater,
} from "./shared/compare-elements.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Checks whether the iterable's elements are sorted in ascending order according to a custom
 * comparator.
 *
 * An iterator that yields zero or one element is always considered sorted.
 *
 * @param iterable The iterator to check.
 * @param comparator The comparator each adjacent pair of elements must satisfy.
 *
 * @example
 * ```typescript
 * console.log(isSortedBy([1, 2, 2, 9], ascNumber));
 * // Output: true
 * console.log(isSortedBy([9, 2, 2, 1], ascNumber));
 * // Output: false
 * ```
 *
 * @see {@link isSorted} for a version that uses the default comparator.
 * @see {@link isSortedByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function isSortedBy<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	comparator: CompareByComparator<ElementType>,
): boolean {
	comparator = assertFunction(comparator);

	const iterator = toIterableIterator(iterable);
	const first = iterator.next();
	if (first.done) return true;

	let previous = first.value;
	for (const current of iterator) {
		const comparison = compareIteratorElements<ElementType>(
			previous,
			current,
			comparator,
		);
		if (orderingIsGreater(comparison)) return false;

		previous = current;
	}

	return true;
}
