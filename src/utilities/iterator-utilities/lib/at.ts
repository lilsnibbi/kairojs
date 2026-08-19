import type { IterableResolvable } from "@types";
import { drop } from "./drop.ts";
import { first } from "./first.ts";
import { assertNotNegative } from "./shared/assert-not-negative.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/to-integer-or-infinity-or-throw.ts";

/**
 * Advances the iterable to the `index`th element and returns it.
 *
 * @param iterable The iterator to return an element from.
 * @param index The index of the element to retrieve.
 * @returns The element at the given index, or `undefined` if the iterator is exhausted first.
 *
 * @example
 * ```typescript
 * console.log(at([1, 2, 3, 4, 5], 2));
 * // Output: 3
 * ```
 *
 * @remarks
 *
 * This function consumes the input iterator up to the given index.
 *
 * @since 1.0.0
 */
export function at<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	index: number,
): ElementType | undefined {
	index = assertNotNegative(toIntegerOrInfinityOrThrow(index), index);
	return first(index === 0 ? iterable : drop(iterable, index));
}
