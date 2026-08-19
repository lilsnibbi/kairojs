import type { IterableResolvable, LexicographicComparison } from "@types";
import { compare } from "./compare.ts";
import { orderingIsGreater } from "./shared/compare-elements.ts";

/**
 * Determines whether `iterable` is {@link LexicographicComparison lexicographically} greater than
 * `other`.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 *
 * @example
 * ```typescript
 * console.log(greaterThan([1], [1]));
 * // Output: false
 * console.log(greaterThan([1, 2], [1]));
 * // Output: true
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function greaterThan<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): boolean {
	const result = compare(iterable, other);
	return orderingIsGreater(result);
}

export { greaterThan as gt };
