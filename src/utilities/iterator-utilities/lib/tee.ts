import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { repeat } from "./repeat.ts";
import { assertNotNegative } from "./shared/assert-not-negative.ts";
import { makeIterableIterator } from "./shared/make-iterable-iterator.ts";
import { toIntegerOrThrow } from "./shared/to-integer-or-throw.ts";
import { toArray } from "./to-array.ts";

/**
 * Splits a single iterable into `count` independent iterators, each replaying the same sequence
 * of values.
 *
 * The source is buffered lazily: a value is pulled from it only once every returned iterator has
 * moved past it, so this is safe to use even when the returned iterators are consumed at
 * different rates.
 *
 * @param iterable The iterator to tee.
 * @param count The number of independent iterators to create.
 * @returns An array of `count` iterators that each yield the same values as the input.
 *
 * @example
 * ```typescript
 * const [iter1, iter2] = tee([1, 2, 3, 4, 5], 2);
 * console.log([...iter1]);
 * // Output: [1, 2, 3, 4, 5]
 *
 * console.log([...iter2]);
 * // Output: [1, 2, 3, 4, 5]
 * ```
 *
 * @since 1.0.0
 */
export function tee<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType>[] {
	count = assertNotNegative(toIntegerOrThrow(count), count);
	if (count === 0) return [];

	const buffered: ElementType[] = [];
	const cursors = toArray(repeat(0, count));
	const resolvedIterable = from(iterable);

	const iterables: IterableIterator<ElementType>[] = [];
	for (let cursorIndex = 0; cursorIndex < count; cursorIndex++) {
		const teed = makeIterableIterator<ElementType>(() => {
			if (cursors[cursorIndex]! >= buffered.length) {
				const result = resolvedIterable.next();
				if (result.done) {
					return { done: true, value: undefined };
				}

				buffered.push(result.value);
			}

			return { done: false, value: buffered[cursors[cursorIndex]!++]! };
		});

		iterables.push(teed);
	}

	return iterables;
}
