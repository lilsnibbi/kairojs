import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Filters the first iterable using the truthiness of the corresponding element in a second,
 * selector iterable.
 *
 * @param iterable The iterator whose elements are selected.
 * @param selectors The iterator of booleans deciding whether the matching element is kept.
 * @returns An iterator over the elements of `iterable` whose matching `selectors` entry is `true`.
 *
 * @example
 * ```typescript
 * console.log([...compress([1, 2, 3, 4, 5], [true, false, true, false, true])]);
 * // Output: [1, 3, 5]
 * ```
 *
 * @remarks
 *
 * This function consumes both inputs together until either is exhausted.
 *
 * @since 1.0.0
 */
export function* compress<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	selectors: IterableResolvable<boolean>,
): IterableIterator<ElementType> {
	const resolvedSelectors = from(selectors);
	for (const element of toIterableIterator(iterable)) {
		const selectorResult = resolvedSelectors.next();
		if (selectorResult.done) {
			return;
		}

		if (selectorResult.value) {
			yield element;
		}
	}
}
