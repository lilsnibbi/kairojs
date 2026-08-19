import { isFunction } from "./is-function.ts";

/**
 * Splits an array into two arrays based on a predicate: one holding every element the predicate
 * accepted, the other holding every element it rejected. The source array is not mutated.
 *
 * @param array The array to partition.
 * @param predicate Returns `true` to place an element in the first partition, `false` for the
 * second.
 * @returns A `[accepted, rejected]` tuple.
 * @throws {TypeError} If `array` is not an array, or `predicate` is not a function.
 *
 * @since 1.0.0
 */
export function partition<T>(
	array: T[],
	predicate: (value: T, index: number) => boolean,
): [T[], T[]] {
	if (!Array.isArray(array)) throw new TypeError("entries must be an array.");
	if (!isFunction(predicate))
		throw new TypeError(
			"predicate must be an function that returns a boolean value.",
		);

	const accepted: T[] = [];
	const rejected: T[] = [];

	for (let index = 0; index < array.length; index++) {
		if (predicate(array[index], index)) {
			accepted.push(array[index]);
		} else {
			rejected.push(array[index]);
		}
	}

	return [accepted, rejected];
}
