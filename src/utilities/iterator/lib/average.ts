import type { IterableResolvable, NumberResolvable } from "@types";
import { map } from "./map.ts";
import { toNumberOrThrow } from "./shared/toNumberOrThrow.ts";

/**
 * Drains the iterable and computes the arithmetic mean of its elements.
 *
 * @param iterable The iterator of number-resolvable values to average.
 * @returns The average of the elements, or `null` if the iterable is empty.
 *
 * @example
 * ```typescript
 * console.log(average([1, 2, 3, 4, 5]));
 * // Output: 3
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function average(
	iterable: IterableResolvable<NumberResolvable>,
): number | null {
	let sum = 0;
	let total = 0;
	for (const value of map(iterable, toNumberOrThrow)) {
		sum += value;
		total++;
	}

	return total === 0 ? null : sum / total;
}
