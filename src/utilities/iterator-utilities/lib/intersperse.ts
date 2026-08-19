import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { makeIterableIterator } from "./shared/make-iterable-iterator.ts";

/**
 * Creates an iterator that inserts `separator` between every pair of adjacent elements of the
 * input.
 *
 * @param iterable The iterator to intersperse.
 * @param separator The value to place between adjacent elements.
 *
 * @example
 * ```typescript
 * console.log([...intersperse([0, 1, 2], 100)]);
 * // Output: [0, 100, 1, 100, 2]
 * ```
 *
 * @example
 * A common use is building a joined string from an iterator's items:
 * ```typescript
 * console.log([...intersperse(['Hello', 'World', '!'], ', ')].join(''));
 * // Output: 'Hello, World, !'
 * ```
 *
 * @since 1.0.0
 */
export function intersperse<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	separator: ElementType,
): IterableIterator<ElementType> {
	let started = false;
	let nextItem: ElementType;
	let nextItemTaken = false;

	const iterator = from(iterable);
	return makeIterableIterator<ElementType>(() => {
		if (started) {
			if (nextItemTaken) {
				nextItemTaken = false;
				return { done: false, value: nextItem };
			}

			const result = iterator.next();
			if (result.done) {
				return { done: true, value: undefined };
			}

			nextItem = result.value;
			nextItemTaken = true;
			return { done: false, value: separator };
		}

		started = true;
		return iterator.next();
	});
}
