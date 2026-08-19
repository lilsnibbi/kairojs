import type { IterableResolvable } from "@types";
import { filter } from "./filter.ts";

/**
 * Creates an iterable that drops every `null` and `undefined` value from the input.
 *
 * @param iterable The iterator to compact.
 *
 * @example
 * ```typescript
 * console.log([...compact([1, null, 2, undefined, 3])]);
 * // Output: [1, 2, 3]
 * ```
 *
 * @since 1.0.0
 */
export function compact<const ElementType>(
	iterable: IterableResolvable<ElementType | null | undefined>,
): IterableIterator<ElementType> {
	return filter(
		iterable,
		(value): value is ElementType => value !== null && value !== undefined,
	);
}
