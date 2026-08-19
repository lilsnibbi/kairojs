import type { CompareByComparator } from "@types";

/**
 * Compares two iterator results that may be `undefined` (meaning "the iterator has no more
 * elements at this position"), falling back to `comparator` once both sides are defined.
 *
 * Mirrors the specification's `CompareArrayElements` algorithm: `undefined` sorts after every
 * defined value, and two `undefined` values are equal.
 *
 * @param x The element from the first sequence at this position, or `undefined` if it is exhausted.
 * @param y The element from the second sequence at this position, or `undefined` if it is exhausted.
 * @param comparator The comparator to fall back to once both `x` and `y` are defined.
 * @returns A negative, zero, or positive number following the usual comparator contract.
 *
 * @see {@link https://tc39.es/ecma262/#sec-comparearrayelements CompareArrayElements}
 *
 * @internal
 */
export function compareIteratorElements<const ElementType>(
	x: ElementType | undefined,
	y: ElementType | undefined,
	comparator: CompareByComparator<ElementType>,
): number {
	if (typeof x === "undefined") {
		if (typeof y === "undefined") return 0;
		return 1;
	}

	if (typeof y === "undefined") {
		return -1;
	}

	return comparator(
		x as Exclude<ElementType, undefined>,
		y as Exclude<ElementType, undefined>,
	);
}

/**
 * Whether a comparator result represents "less than".
 *
 * @internal
 */
export function orderingIsLess(ordering: number) {
	return ordering < 0;
}

/**
 * Whether a comparator result represents "equal".
 *
 * @internal
 */
export function orderingIsEqual(ordering: number) {
	return ordering === 0;
}

/**
 * Whether a comparator result represents "greater than".
 *
 * @internal
 */
export function orderingIsGreater(ordering: number) {
	return ordering > 0;
}
