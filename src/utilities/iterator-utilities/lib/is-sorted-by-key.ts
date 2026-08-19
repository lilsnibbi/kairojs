import type { CompareByComparator, IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import {
	compareIteratorElements,
	orderingIsGreater,
} from "./shared/compare-elements.ts";
import { defaultCompare } from "./shared/comparators.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Checks whether the iterable's elements are sorted in ascending order once mapped through a key
 * extraction function, rather than compared directly.
 *
 * @param iterable The iterator to check.
 * @param callbackFn The function extracting the comparison key from an element.
 * @param comparator The comparator the extracted keys must satisfy. Defaults to the same
 * string-converted comparator {@link isSorted} uses.
 *
 * @example
 * ```typescript
 * console.log(isSortedByKey(['c', 'bb', 'aaa'], (s) => s.length));
 * // Output: true
 * ```
 *
 * @see {@link isSorted} for a version that uses the default comparator.
 * @see {@link isSortedBy} for a version that compares elements directly.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function isSortedByKey<const ElementType, const MappedType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (a: ElementType, index: number) => MappedType,
	comparator: CompareByComparator<MappedType> = defaultCompare,
): boolean {
	callbackFn = assertFunction(callbackFn);

	const iterator = toIterableIterator(iterable);
	const first = iterator.next();
	if (first.done) return true;

	let previousKey = callbackFn(first.value, 0);
	let index = 1;
	for (const current of iterator) {
		const currentKey = callbackFn(current, index++);
		const comparison = compareIteratorElements<MappedType>(
			previousKey,
			currentKey,
			comparator,
		);
		if (orderingIsGreater(comparison)) return false;

		previousKey = currentKey;
	}

	return true;
}
