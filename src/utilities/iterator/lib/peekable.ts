import type { IterableResolvable, Peekable } from "@types";
import { from } from "./from.ts";

/**
 * Wraps an iterable in a {@link Peekable} that can report its next value without consuming it.
 *
 * @param iterable The iterable to create a peekable iterator from.
 * @returns A new peekable iterator.
 *
 * @example
 * ```typescript
 * const iterator = peekable([1, 2, 3, 4, 5]);
 *
 * console.log(iterator.next());
 * // Output: { value: 1, done: false }
 *
 * console.log(iterator.peek());
 * // Output: { value: 2, done: false }
 *
 * console.log(iterator.next());
 * // Output: { value: 2, done: false }
 * ```
 *
 * @since 1.0.0
 */
export function peekable<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): Peekable<ElementType> {
	const resolvedIterable = from(iterable);
	let peeked: IteratorResult<ElementType> | undefined;
	return {
		next() {
			if (peeked) {
				const value = peeked;
				peeked = undefined;
				return value;
			}

			return resolvedIterable.next();
		},
		peek() {
			peeked ??= resolvedIterable.next();
			return peeked;
		},
		[Symbol.iterator]() {
			return this as IterableIterator<ElementType>;
		},
	};
}
