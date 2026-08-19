import type { CompareByComparator, IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import {
	compareIteratorElements,
	orderingIsGreater,
} from "./shared/compare-elements.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Returns the element that compares as the minimum according to a custom comparator.
 *
 * If several elements are equally minimum, the last one is returned. An empty iterator returns
 * `null`.
 *
 * @param iterable The iterator to find the minimum element of.
 * @param comparator The comparator used to rank elements.
 * @returns The minimum element, or `null` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(minBy([-3, 0, 1, 5, -10], ascNumber));
 * // Output: -10
 * ```
 *
 * @see {@link min} for a version that uses the default comparator.
 * @see {@link minByKey} for a version that compares extracted keys instead.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function minBy<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	comparator: CompareByComparator<ElementType>,
): ElementType | null {
	comparator = assertFunction(comparator);

	const iterator = toIterableIterator(iterable);
	const first = iterator.next();
	if (first.done) return null;

	let minimum = first.value;
	for (const value of iterator) {
		const comparison = compareIteratorElements<ElementType>(
			value,
			minimum,
			comparator,
		);

		if (!orderingIsGreater(comparison)) {
			minimum = value;
		}
	}

	return minimum;
}
