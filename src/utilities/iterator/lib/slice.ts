import type { IterableResolvable } from "@types";
import { drop } from "./drop.ts";
import { dropLast } from "./dropLast.ts";
import { empty } from "./empty.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/toIntegerOrInfinityOrThrow.ts";
import { take } from "./take.ts";
import { takeLast } from "./takeLast.ts";

/**
 * Creates an iterator over the elements from index `start` up to (but excluding) index `end`,
 * mirroring the semantics of {@link Array.prototype.slice} including negative indices.
 *
 * @param iterable The iterator to slice.
 * @param start The index at which to begin extraction. Negative values count from the end.
 * @param end The index at which to end extraction. Negative values count from the end.
 * @returns An iterator over the elements of `iterable` between `start` and `end`.
 *
 * @example
 * ```typescript
 * console.log([...slice([1, 2, 3, 4, 5], 1, 3)]);
 * // Output: [2, 3]
 *
 * console.log([...slice([1, 2, 3, 4, 5], -2)]);
 * // Output: [4, 5]
 *
 * console.log([...slice([1, 2, 3, 4, 5], 2)]);
 * // Output: [3, 4, 5]
 * ```
 *
 * @remarks
 *
 * This function consumes the input iterator based on `start` and `end`, so the original iterator
 * should not be reused afterward.
 *
 * @since 1.0.0
 */
export function slice<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	start?: number,
	end?: number,
): IterableIterator<ElementType> {
	// https://tc39.es/ecma262/#sec-array.prototype.slice
	start = toIntegerOrInfinityOrThrow(start ?? 0);
	if (start === Number.NEGATIVE_INFINITY) {
		start = 0;
	}

	// If `end` is omitted, this behaves like `drop` or `takeLast` depending on the sign of `start`.
	if (end === undefined) {
		return start >= 0 //
			? drop(iterable, start)
			: takeLast(iterable, -start);
	}

	end = toIntegerOrInfinityOrThrow(end);
	if (end < 0) {
		// `end` of `-Infinity` always yields an empty result.
		if (end === Number.NEGATIVE_INFINITY) {
			return empty();
		}

		if (start === 0) {
			return dropLast(iterable, -end);
		}

		if (start >= 0) {
			return dropLast(drop(iterable, start), -end);
		}

		if (start >= end) {
			return empty();
		}

		// Both `start` and `end` are negative: take the elements between them.
		return take(takeLast(iterable, -start), end - start);
	}

	if (start >= end) return empty();

	return end === Number.POSITIVE_INFINITY //
		? drop(iterable, start)
		: take(drop(iterable, start), end - start);
}
