import type { IterableResolvable } from "@types";
import { empty } from "./empty.ts";
import { assertNotNegative } from "./shared/assertNotNegative.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/toIntegerOrInfinityOrThrow.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Advances the iterable by `count` elements and returns what remains.
 *
 * @param iterable The iterator to drop values from.
 * @param count The number of elements to drop from the start of the iteration.
 * @returns An iterator that contains the elements of the provided iterator, except for the first
 * `count` elements.
 *
 * @example
 * ```typescript
 * console.log([...drop([1, 2, 3, 4, 5], 2)]);
 * // Output: [3, 4, 5]
 * ```
 *
 * @since 1.0.0
 */
export function drop<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType> {
	count = assertNotNegative(toIntegerOrInfinityOrThrow(count), count);
	const resolvedIterable = toIterableIterator(iterable);

	// A count of zero is a no-op, and an infinite count always empties the iterable.
	if (count === 0) return resolvedIterable;
	if (count === Number.POSITIVE_INFINITY) return empty();

	for (let index = 0; index < count; index++) {
		if (resolvedIterable.next().done) break;
	}

	return resolvedIterable;
}
