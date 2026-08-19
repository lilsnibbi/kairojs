import type {
	CompareByComparator,
	IterableResolvable,
	LexicographicComparison,
} from "@types";
import { from } from "./from.ts";
import {
	compareIteratorElements,
	orderingIsEqual,
	orderingIsLess,
} from "./shared/compare-elements.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * {@link LexicographicComparison Lexicographically} compares two iterables using a custom
 * comparator.
 *
 * @param iterable The iterator to compare.
 * @param other The iterator to compare against.
 * @param comparator The comparator used to compare corresponding elements.
 * @returns `-1` if `iterable` sorts before `other`, `1` if it sorts after, `0` if they are equal.
 *
 * @example
 * ```typescript
 * const x = [1, 2, 3, 4];
 * const y = [1, 4, 9, 16];
 * console.log(compareBy(x, y, (a, b) => ascNumber(a, b)));
 * // Output: -1
 * console.log(compareBy(x, y, (a, b) => ascNumber(a * a, b)));
 * // Output: 0
 * console.log(compareBy(x, y, (a, b) => ascNumber(a * 2, b)));
 * // Output: 1
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function compareBy<const ElementType>(
	iterable: IterableResolvable<ElementType | undefined>,
	other: IterableResolvable<ElementType | undefined>,
	comparator: CompareByComparator<ElementType>,
): LexicographicComparison {
	const otherIterator = from(other);

	for (const value of toIterableIterator(iterable)) {
		const otherResult = otherIterator.next();
		if (otherResult.done) return 1;

		const comparison = compareIteratorElements<ElementType>(
			value,
			otherResult.value,
			comparator,
		);
		if (!orderingIsEqual(comparison)) {
			return orderingIsLess(comparison) ? -1 : 1;
		}
	}

	return otherIterator.next().done ? 0 : -1;
}
