import type { IterableResolvable } from "@types";
import { empty } from "./empty.ts";
import { from } from "./from.ts";
import { assertNotNegative } from "./shared/assertNotNegative.ts";
import { makeIterableIterator } from "./shared/makeIterableIterator.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/toIntegerOrInfinityOrThrow.ts";

/**
 * Creates an iterable that yields at most the first `count` elements of the input.
 *
 * @param iterable The iterator to take values from.
 * @param count The maximum number of values to take from the iterator.
 * @returns An iterator that yields at most `count` values from the provided iterator.
 *
 * @example
 * ```typescript
 * console.log([...take([1, 2, 3, 4, 5], 2)]);
 * // Output: [1, 2]
 * ```
 *
 * @since 1.0.0
 */
export function take<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType> {
	count = assertNotNegative(toIntegerOrInfinityOrThrow(count), count);
	if (count === 0) return empty();

	let taken = 0;
	const resolvedIterable = from(iterable);
	return makeIterableIterator<ElementType>(() => {
		if (taken >= count) return { done: true, value: undefined };

		taken++;
		return resolvedIterable.next();
	});
}
