import type { IterableResolvable, NumberResolvable } from "@types";
import { map } from "./map.ts";
import { toNumberOrThrow } from "./shared/to-number-or-throw.ts";

/**
 * Drains the iterable and adds up all its elements.
 *
 * @param iterable The iterator of number-resolvable values to sum.
 * @returns The sum of the elements in the input iterator.
 *
 * @example
 * ```typescript
 * console.log(sum([1, 2, 3, 4, 5]));
 * // Output: 15
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function sum(iterable: IterableResolvable<NumberResolvable>) {
	let total = 0;
	for (const value of map(iterable, toNumberOrThrow)) {
		total += value;
	}

	return total;
}
