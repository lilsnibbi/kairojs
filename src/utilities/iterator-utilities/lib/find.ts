import type { IterableResolvable } from "@types";
import { filter } from "./filter.ts";
import { first } from "./first.ts";

/**
 * Advances the iterable until an element passes the test, returning it.
 *
 * @param iterable The iterator to search.
 * @param callbackFn A function that determines whether a value is the one being searched for.
 * @returns The first matching element, or `undefined` if none match.
 *
 * @example
 * ```typescript
 * console.log(find([1, 2, 3, 4, 5], (value) => value % 2 === 0));
 * // Output: 2
 * ```
 *
 * @remarks
 *
 * This function consumes the iterator until a match is found or it is exhausted.
 *
 * @since 1.0.0
 */
export function find<const ElementType, const FilteredType extends ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => element is FilteredType,
): FilteredType | undefined;
export function find<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): ElementType | undefined;
export function find<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => boolean,
): ElementType | undefined {
	return first(filter(iterable, callbackFn));
}
