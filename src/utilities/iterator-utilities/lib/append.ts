import type { IterableResolvable } from "@types";
import { chain } from "./chain.ts";

/**
 * Appends one or more iterables to the end of the first, combining them into a single iterable —
 * similar to `[...a, ...b, ...c]`.
 *
 * @param iterable The iterator to append values to.
 * @param iterables The iterables to append, in order.
 * @returns An iterator that yields the values of `iterable` followed by the values of `iterables`.
 *
 * @example
 * ```typescript
 * console.log([...append([1, 2, 3], [4, 5, 6], [7, 8, 9])]);
 * // Output: [1, 2, 3, 4, 5, 6, 7, 8, 9]
 * ```
 *
 * @since 1.0.0
 */
export function append<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	...iterables: IterableResolvable<ElementType>[]
): IterableIterator<ElementType> {
	return chain(iterable, ...iterables);
}

export { append as concat };
