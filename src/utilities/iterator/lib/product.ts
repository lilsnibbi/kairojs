import type { IterableResolvable } from "@types";
import { map } from "./map.ts";
import { toNumberOrThrow } from "./shared/toNumberOrThrow.ts";

/**
 * Drains the iterable and multiplies all its elements together. An empty iterable produces `1`,
 * the multiplicative identity.
 *
 * @param iterable The iterator of numbers to multiply.
 * @returns The product of the elements in the input iterator.
 *
 * @example
 * ```typescript
 * console.log(product([1, 2, 3, 4, 5]));
 * // Output: 120
 *
 * console.log(product([1, 2, 3, 4, 5, 0]));
 * // Output: 0
 * ```
 *
 * @since 1.0.0
 */
export function product(iterable: IterableResolvable<number>): number {
	let result = 1;
	for (const value of map(iterable, toNumberOrThrow)) {
		result *= value;
	}

	return result;
}
