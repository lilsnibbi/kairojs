import type { CompareByComparator, LexicographicComparison } from "@types";

function swap<const ElementType>(
	comparator: CompareByComparator<ElementType>,
): CompareByComparator<ElementType> {
	return (x, y) => (0 - comparator(x, y)) as LexicographicComparison;
}

/**
 * Compares two elements lexicographically by converting both to strings first.
 *
 * This is the comparator {@link compare} and {@link isSorted} fall back to when no custom
 * comparator is supplied. When string comparison is not what you want, pass a comparator of your
 * own to {@link compareBy} or {@link isSortedBy} instead.
 *
 * @param x The first element to compare.
 * @param y The second element to compare.
 * @returns The lexicographic comparison of the two elements.
 *
 * @since 1.0.0
 */
export function defaultCompare<const ElementType>(
	x: ElementType,
	y: ElementType,
): LexicographicComparison {
	return ascNumber(String(x), String(y));
}

export { defaultCompare as ascString };

/**
 * The descending counterpart of {@link ascString} — compares two elements as strings, reversing
 * the result.
 *
 * @since 1.0.0
 */
export const descString = swap(defaultCompare);

/**
 * Compares two elements numerically using the starship-operator trick: the difference of two
 * boolean comparisons produces `-1`, `0`, or `1` without an intermediate subtraction that could
 * overflow or lose precision on `bigint` input.
 *
 * @param x The first element to compare.
 * @param y The second element to compare.
 * @returns The numeric comparison of the two elements.
 *
 * @since 1.0.0
 */
export function ascNumber(
	x: number | bigint | string,
	y: number | bigint | string,
): LexicographicComparison {
	// @ts-expect-error: The subtraction is intentional
	return (x > y) - (x < y);
}

/**
 * The descending counterpart of {@link ascNumber} — compares two elements numerically, reversing
 * the result.
 *
 * @since 1.0.0
 */
export const descNumber = swap(ascNumber);
