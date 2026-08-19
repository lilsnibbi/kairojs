import type { IterableResolvable, LexicographicComparison } from "@types";
import { compareBy } from "./compare-by.ts";
import { defaultCompare } from "./shared/comparators.ts";

/**
 * {@link LexicographicComparison Lexicographically} compares two iterables using the default,
 * string-converted comparator.
 *
 * When comparing anything other than strings, use {@link compareBy} with a custom comparator
 * instead.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 * @returns `-1` if `iterable` sorts before `other`, `1` if it sorts after, `0` if they are equal.
 *
 * @example
 * ```typescript
 * console.log(compare([1], [1]));
 * // Output: 0
 * console.log(compare([1], [1, 2]));
 * // Output: -1
 * console.log(compare([1, 2], [1]));
 * // Output: 1
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function compare<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): LexicographicComparison {
	return compareBy(iterable, other, defaultCompare);
}
