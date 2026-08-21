import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assertFunction.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Drains the iterable, calling the callback once for each element.
 *
 * @param iterable The iterator to iterate over.
 * @param callbackFn A function to execute for each element. Its return value is discarded.
 *
 * @example
 * ```typescript
 * forEach([1, 2, 3, 4, 5], (value) => console.log(value));
 * // Output: 1, 2, 3, 4, 5
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function forEach<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => void,
): void {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const element of toIterableIterator(iterable)) {
		callbackFn(element, index++);
	}
}
