import type { IterableResolvable } from "@types";
import { from } from "./from.ts";

/**
 * Advances the iterable once to check whether it has any elements.
 *
 * @param iterable The iterator to check.
 * @returns `true` if the iterator has no elements; otherwise, `false`.
 *
 * @example
 * ```typescript
 * console.log(isEmpty([]));
 * // Output: true
 *
 * console.log(isEmpty([1, 2, 3, 4, 5]));
 * // Output: false
 * ```
 *
 * @remarks
 *
 * This function consumes the first value of the iterator.
 *
 * @since 1.0.0
 */
export function isEmpty<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): boolean {
	return from(iterable).next().done ?? false;
}
