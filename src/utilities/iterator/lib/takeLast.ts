import type { IterableResolvable } from "@types";
import { empty } from "./empty.ts";
import { assertNotNegative } from "./shared/assertNotNegative.ts";
import { makeIterableIterator } from "./shared/makeIterableIterator.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/toIntegerOrInfinityOrThrow.ts";
import { toArray } from "./toArray.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Drains the iterable and creates a new iterator over just its last `count` elements.
 *
 * @param iterable The iterator to take values from.
 * @param count The number of values to take from the end of the iterator.
 * @returns An iterator that contains the last `count` elements of the provided iterator.
 *
 * @example
 * ```typescript
 * console.log([...takeLast([1, 2, 3, 4, 5], 2)]);
 * // Output: [4, 5]
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function takeLast<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType> {
	count = assertNotNegative(toIntegerOrInfinityOrThrow(count), count);
	if (count === 0) return empty();
	if (count === Number.POSITIVE_INFINITY) return toIterableIterator(iterable);

	const array = toArray(iterable);
	let index = Math.max(0, array.length - count);
	return makeIterableIterator<ElementType>(() => {
		if (index >= array.length) {
			return { done: true, value: undefined };
		}

		return { done: false, value: array[index++]! };
	});
}
