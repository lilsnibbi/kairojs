import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assertFunction.ts";
import { toIterableIterator } from "./toIterableIterator.ts";

/**
 * Creates an iterable that yields the result of calling the callback on each element.
 *
 * @param iterable The iterator to map over.
 * @param callbackFn A function to execute for each element. Its return value is yielded.
 *
 * @example
 * ```typescript
 * const iterable = [1, 2, 3, 4, 5];
 * console.log([...map(iterable, (value) => value * 2)]);
 * // Output: [2, 4, 6, 8, 10]
 * ```
 *
 * @since 1.0.0
 */
export function* map<const ElementType, const MappedType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => MappedType,
): IterableIterator<MappedType> {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	for (const element of toIterableIterator(iterable)) {
		yield callbackFn(element, index++);
	}
}
