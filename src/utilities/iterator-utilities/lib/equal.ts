import type { IterableResolvable } from "@types";
import { equalBy } from "./equal-by.ts";

/**
 * Determines whether two iterables yield the same elements, in the same order, compared with
 * strict equality (`===`).
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 * @returns Whether the two iterators are equal.
 *
 * @example
 * ```typescript
 * console.log(equal([1], [1]));
 * // Output: true
 * console.log(equal([1], [1, 2]));
 * // Output: false
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function equal<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): boolean {
	return equalBy(iterable, other, (a, b) => a === b);
}

export { equal as eq };
