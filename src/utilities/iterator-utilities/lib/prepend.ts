import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterator with the given iterables placed before the first iterable's own values.
 *
 * @param iterable The iterator to prepend values to.
 * @param iterables The iterables to place in front of `iterable`, in order.
 * @returns An iterator that yields the values of `iterables` followed by the values of `iterable`.
 *
 * @example
 * ```typescript
 * console.log([...prepend([3, 4, 5], [1, 2])]);
 * // Output: [1, 2, 3, 4, 5]
 * ```
 *
 * @see {@link append} to append values to the end of an iterator instead.
 *
 * @since 1.0.0
 */
export function* prepend<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	...iterables: IterableResolvable<ElementType>[]
): IterableIterator<ElementType> {
	for (const other of iterables) {
		yield* toIterableIterator(other);
	}

	yield* toIterableIterator(iterable);
}
