import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { makeIterableIterator } from "./shared/makeIterableIterator.ts";

/**
 * Resolves any {@link IterableResolvable} value into a full {@link IterableIterator}, so it can
 * always be used in a `for...of` loop or spread even when the input was a bare {@link Iterator}.
 *
 * @param iterable The iterable or iterable-like object to convert.
 * @returns An iterable iterator.
 *
 * @example
 * ```typescript
 * const array = [1, 2, 3, 4, 5];
 * console.log([...toIterableIterator(array)]);
 * // Output: [1, 2, 3, 4, 5]
 *
 * const set = new Set([1, 2, 3, 4, 5]);
 * console.log([...toIterableIterator(set)]);
 * // Output: [1, 2, 3, 4, 5]
 * ```
 *
 * @since 1.0.0
 */
export function toIterableIterator<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	const resolvedIterable = from(iterable);
	if (Symbol.iterator in resolvedIterable) {
		return resolvedIterable;
	}

	return makeIterableIterator(() => resolvedIterable.next());
}
