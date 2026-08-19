import type { CompareByComparator, IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import {
	compareIteratorElements,
	orderingIsGreater,
} from "./shared/compare-elements.ts";
import { defaultCompare } from "./shared/comparators.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Returns the element whose extracted key compares as the maximum.
 *
 * If several elements produce an equally maximum key, the last one is returned. An empty iterator
 * returns `null`.
 *
 * @param iterable The iterator to find the maximum element of.
 * @param callbackFn The function extracting the comparison key from an element.
 * @param comparator The comparator the extracted keys must satisfy. Defaults to the same
 * string-converted comparator {@link max} uses.
 * @returns The element with the maximum key, or `null` if the iterator is empty.
 *
 * @example
 * ```typescript
 * console.log(maxByKey([-3, 0, 1, 5, -10], (value) => Math.abs(value)));
 * // Output: -10
 * ```
 *
 * @see {@link max} for a version that uses the default comparator.
 * @see {@link maxBy} for a version that compares elements directly.
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function maxByKey<const ElementType, const MappedType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => MappedType,
	comparator: CompareByComparator<MappedType> = defaultCompare,
): ElementType | null {
	callbackFn = assertFunction(callbackFn);

	const iterator = toIterableIterator(iterable);
	const first = iterator.next();
	if (first.done) return null;

	let maximum = first.value;
	let maximumKey = callbackFn(maximum, 0);
	let index = 1;
	for (const value of iterator) {
		const key = callbackFn(value, index++);
		const comparison = compareIteratorElements<MappedType>(
			maximumKey,
			key,
			comparator,
		);

		if (!orderingIsGreater(comparison)) {
			maximum = value;
			maximumKey = key;
		}
	}

	return maximum;
}
