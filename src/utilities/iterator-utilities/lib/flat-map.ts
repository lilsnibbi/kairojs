import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Maps every element through the callback and flattens the resulting iterables into a single
 * sequence, equivalent to {@link map} followed by {@link flat}.
 *
 * @param iterable The iterator to map over.
 * @param callbackFn A function that returns an iterable (or iterator) of values to yield for each
 * source element.
 * @returns An iterator that applies the callback to each element and yields the flattened results.
 *
 * @example
 * ```typescript
 * console.log([...flatMap([1, 2, 3], (value) => [value, value * 2])]);
 * // Output: [1, 2, 2, 4, 3, 6]
 * ```
 *
 * @since 1.0.0
 */
export function* flatMap<const ElementType, const MappedType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (
		element: ElementType,
		index: number,
	) => IterableResolvable<MappedType>,
): IterableIterator<MappedType> {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		yield* toIterableIterator(callbackFn(value, index++));
	}
}
