import type { IterableResolvable, LexicographicComparison } from "@types";
import { compare } from "./compare.ts";
import { orderingIsLess } from "./shared/compare-elements.ts";

/**
 * Determines whether `iterable` is {@link LexicographicComparison lexicographically} greater than
 * or equal to `other`.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 *
 * @example
 * ```typescript
 * console.log(greaterOrEqualThan([1], [1]));
 * // Output: true
 * console.log(greaterOrEqualThan([1], [1, 2]));
 * // Output: false
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function greaterOrEqualThan<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): boolean {
	const result = compare(iterable, other);
	return !orderingIsLess(result);
}

export { greaterOrEqualThan as ge };
