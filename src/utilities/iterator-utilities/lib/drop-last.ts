import type { IterableResolvable } from "@types";
import { empty } from "./empty.ts";
import { assertNotNegative } from "./shared/assert-not-negative.ts";
import { toIntegerOrInfinityOrThrow } from "./shared/to-integer-or-infinity-or-throw.ts";
import { take } from "./take.ts";
import { toArray } from "./to-array.ts";

/**
 * Drains the iterable and creates a new iterator without its last `count` elements.
 *
 * @param iterable The iterator to drop values from.
 * @param count The number of values to drop from the end of the iterator.
 * @returns An iterator that contains the elements of the provided iterator, except for the last
 * `count` elements.
 *
 * @example
 * ```typescript
 * console.log([...dropLast([1, 2, 3, 4, 5], 2)]);
 * // Output: [1, 2, 3]
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function dropLast<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	count: number,
): IterableIterator<ElementType> {
	count = assertNotNegative(toIntegerOrInfinityOrThrow(count), count);
	const array = toArray(iterable);
	if (array.length <= count) return empty();
	return take(array.values(), array.length - count);
}
