import type { IterableResolvable, UnzipIterable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Transposes an iterable of tuples into a tuple of arrays — the inverse of {@link zip}.
 *
 * @param iterable An iterable of same-length arrays to unzip.
 * @returns An array of arrays, one per tuple position, holding the values from that position.
 *
 * @example
 * ```typescript
 * const [numbers, letters] = unzip([[1, 'a'], [2, 'b'], [3, 'c']]);
 *
 * console.log(numbers);
 * // Output: [1, 2, 3]
 *
 * console.log(letters);
 * // Output: ['a', 'b', 'c']
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterable, and throws if it is empty, yields a non-array
 * value, or yields arrays of inconsistent length.
 *
 * @since 1.0.0
 */
export function unzip<const ElementType extends readonly any[]>(
	iterable: IterableResolvable<ElementType>,
): UnzipIterable<ElementType> {
	const resolvedIterable = toIterableIterator(iterable);
	const firstResult = resolvedIterable.next();
	if (firstResult.done) {
		throw new Error("Cannot unzip an empty iterable");
	}

	if (!Array.isArray(firstResult.value)) {
		throw new Error("Cannot unzip an iterable that does not yield an array");
	}

	const size = firstResult.value.length;
	const results: ElementType[][] = [];
	for (let index = 0; index < size; index++)
		results.push([firstResult.value[index]]);

	for (const entries of resolvedIterable) {
		if (!Array.isArray(entries)) {
			throw new Error("Cannot unzip an iterable that does not yield an array");
		}

		if (entries.length !== size) {
			throw new Error(
				"Cannot unzip an iterable that yields arrays of different sizes",
			);
		}

		for (let index = 0; index < size; index++) {
			results[index]!.push(entries[index]);
		}
	}

	return results as UnzipIterable<ElementType>;
}
