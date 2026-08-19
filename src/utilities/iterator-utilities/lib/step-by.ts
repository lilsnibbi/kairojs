import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { assertPositive } from "./shared/assert-positive.ts";
import { makeIterableIterator } from "./shared/make-iterable-iterator.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/to-integer-or-infinity-or-throw.ts";

/**
 * Creates an iterator that starts at the same element but skips ahead by `step` on every
 * subsequent call.
 *
 * @param iterable The iterator to step over.
 * @param step A positive integer describing how many elements to advance each time.
 *
 * @example
 * ```typescript
 * console.log([...stepBy([0, 1, 2, 3, 4, 5], 2)]);
 * // Output: [0, 2, 4]
 * ```
 *
 * @remarks
 *
 * The first element is always yielded, regardless of the step given.
 *
 * @since 1.0.0
 */
export function stepBy<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	step: number,
): IterableIterator<ElementType> {
	step = assertPositive(toIntegerOrInfinityOrThrow(step), step);

	const iterator = from(iterable);
	return makeIterableIterator<ElementType>(() => {
		const result = iterator.next();
		if (result.done) {
			return { done: true, value: undefined };
		}

		for (let skipped = 0; skipped < step - 1; skipped++) {
			if (iterator.next().done) break;
		}

		return { done: false, value: result.value };
	});
}
