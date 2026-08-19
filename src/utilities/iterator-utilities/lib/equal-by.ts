import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Determines whether two iterables have the same length and every corresponding pair of elements
 * satisfies the given equality function.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 * @param callbackFn The equality function to compare corresponding elements with.
 * @returns Whether the two iterators are equal with respect to `callbackFn`.
 *
 * @example
 * ```typescript
 * const x = [1, 2, 3, 4];
 * const y = [1, 4, 9, 16];
 *
 * console.log(equalBy(x, y, (a, b) => a * a === b));
 * // Output: true
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function equalBy<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	other: IterableResolvable<ElementType>,
	callbackFn: (x: ElementType, y: ElementType) => boolean,
): boolean {
	callbackFn = assertFunction(callbackFn);

	const otherIterator = from(other);

	for (const value of toIterableIterator(iterable)) {
		const otherResult = otherIterator.next();
		if (otherResult.done || !callbackFn(value, otherResult.value)) return false;
	}

	return otherIterator.next().done === true;
}

export { equalBy as eqBy };
