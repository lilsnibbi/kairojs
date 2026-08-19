import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { assertPositive } from "./shared/assert-positive.ts";
import { makeIterableIterator } from "./shared/make-iterable-iterator.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/to-integer-or-infinity-or-throw.ts";

/**
 * Creates an iterable of overlapping arrays, each holding `count` consecutive elements — a
 * sliding window over the input.
 *
 * @param iterable The iterator to take values from.
 * @param count The number of values in each window.
 * @returns An iterator that yields windows of `count` values from the provided iterator.
 *
 * @example
 * ```typescript
 * console.log([...windows([1, 2, 3, 4, 5], 2)]);
 * // Output: [[1, 2], [2, 3], [3, 4], [4, 5]]
 * ```
 *
 * @since 1.0.0
 */
export function windows<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType[]> {
	count = assertPositive(toIntegerOrInfinityOrThrow(count), count);

	const buffer: ElementType[] = [];
	const resolvedIterable = from(iterable);
	return makeIterableIterator<ElementType[]>(() => {
		while (buffer.length !== count) {
			const result = resolvedIterable.next();
			if (result.done) return { done: true, value: undefined };

			buffer.push(result.value);
		}

		const value = buffer.slice();
		buffer.shift();
		return { done: false, value };
	});
}
