import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Creates an iterable that pairs each element with its zero-based index.
 *
 * @param iterable The iterator to enumerate.
 * @returns An iterator that yields `[index, value]` pairs.
 *
 * @example
 * ```typescript
 * for (const [index, value] of enumerate(['a', 'b', 'c'])) {
 *   console.log(`Index: ${index}, Value: ${value}`);
 *   // Output: Index: 0, Value: a
 *   // Output: Index: 1, Value: b
 *   // Output: Index: 2, Value: c
 * }
 * ```
 *
 * @since 1.0.0
 */
export function* enumerate<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<[number, ElementType]> {
	let index = 0;
	for (const value of toIterableIterator(iterable)) {
		yield [index++, value];
	}
}
