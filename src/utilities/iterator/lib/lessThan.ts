import type { IterableResolvable, LexicographicComparison } from "@types";
import { compare } from "./compare.ts";
import { orderingIsLess } from "./shared/compareElements.ts";

/**
 * Determines whether `iterable` is {@link LexicographicComparison lexicographically} less than
 * `other`.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 *
 * @example
 * ```typescript
 * console.log(lessThan([1], [1]));
 * // Output: false
 * console.log(lessThan([1], [1, 2]));
 * // Output: true
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function lessThan<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
): boolean {
	const result = compare(iterable, other);
	return orderingIsLess(result);
}

export { lessThan as lt };
