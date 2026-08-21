import type { IterableResolvable } from "@types";
import { assertPositive } from "./shared/assertPositive.ts";
import { toIntegerOrThrow } from "./shared/toIntegerOrThrow.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Groups the elements of the iterable into arrays of at most `size` elements each.
 *
 * @param iterable The iterator whose elements to chunk.
 * @param size The maximum size of each chunk.
 *
 * @example
 * ```typescript
 * console.log([...chunk([1, 2, 3, 4, 5], 2)]);
 * // Output: [[1, 2], [3, 4], [5]]
 * ```
 *
 * @since 1.0.0
 */
export function* chunk<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	size: number,
): IterableIterator<ElementType[]> {
	size = assertPositive(toIntegerOrThrow(size), size);

	let buffer: ElementType[] = [];
	for (const element of toIterableIterator(iterable)) {
		buffer.push(element);

		if (buffer.length === size) {
			yield buffer;
			buffer = [];
		}
	}

	if (buffer.length) {
		yield buffer;
	}
}
