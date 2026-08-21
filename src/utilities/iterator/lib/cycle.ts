import type { IterableResolvable } from "@types";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Creates an infinite iterable that replays the elements of the input over and over.
 *
 * @param iterable The iterator to cycle over.
 *
 * @example
 * ```typescript
 * const iterable = cycle([1, 2, 3]);
 * for (const element of iterable) {
 *   console.log(element);
 *   // Output: 1, 2, 3, 1, 2, 3, 1, 2, 3, ...
 * }
 * ```
 *
 * @remarks
 *
 * If the source iterable is empty, the resulting iterator never yields anything and never ends.
 *
 * @since 1.0.0
 */
export function* cycle<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	const buffered: ElementType[] = [];
	for (const element of toIterableIterator(iterable)) {
		yield element;
		buffered.push(element);
	}

	while (buffered.length > 0) {
		for (const element of buffered) {
			yield element;
		}
	}
}
