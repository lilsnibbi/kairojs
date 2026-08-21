import type { IterableResolvable } from "@types";
import { from } from "./from.ts";
import { assertFunction } from "./shared/assertFunction.ts";
import { makeIterableIterator } from "./shared/makeIterableIterator.ts";

/**
 * Passes every element through unchanged, calling a callback for each one along the way.
 *
 * This is mostly a debugging tool for peeking at intermediate values in a pipeline of chained
 * helpers, though it can also be used to log or record values without otherwise disturbing the
 * iteration.
 *
 * @param iterable The iterator to inspect.
 * @param callbackFn A function called with each element and its index before it is yielded.
 *
 * @example
 * ```typescript
 * let iter = inspect([1, 4, 2, 3], (value) => console.log(`about to filter: ${value}`));
 * iter = filter(iter, (value) => value % 2 === 0);
 * iter = inspect(iter, (value) => console.log(`made it through filter: ${value}`));
 *
 * console.log(reduce(iter, (acc, value) => acc + value, 0));
 * // Output:
 * // about to filter: 1
 * // about to filter: 4
 * // made it through filter: 4
 * // about to filter: 2
 * // made it through filter: 2
 * // about to filter: 3
 * // 6
 * ```
 *
 * @since 1.0.0
 */
export function inspect<const ElementType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (element: ElementType, index: number) => void,
): IterableIterator<ElementType> {
	callbackFn = assertFunction(callbackFn);

	let index = 0;
	const iterator = from(iterable);
	return makeIterableIterator<ElementType>(() => {
		const result = iterator.next();
		if (!result.done) {
			callbackFn(result.value, index++);
		}

		return result;
	});
}
