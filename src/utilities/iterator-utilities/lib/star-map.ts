import type { IterableResolvable, StarMapParameters } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Like {@link map}, but each inner iterable's values are spread as separate arguments to the
 * callback instead of being passed as a single value.
 *
 * @param iterable The iterable of iterables (for example, an array of tuples) to map over.
 * @param callbackFn The callback function, called with each inner iterable's values spread out.
 * @returns An iterable iterator that yields the mapped elements.
 *
 * @example
 * ```typescript
 * console.log([...starMap([[1, 2], [3, 4], [5, 6]], (a, b) => a + b)]);
 * // Output: [3, 7, 11]
 * ```
 *
 * @since 1.0.0
 */
export function* starMap<
	const ElementType extends IterableResolvable<any>,
	const MappedType,
>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (...args: StarMapParameters<ElementType>) => MappedType,
): IterableIterator<MappedType> {
	callbackFn = assertFunction(callbackFn);

	for (const value of toIterableIterator(iterable)) {
		yield callbackFn(...(toIterableIterator(value) as any));
	}
}
