import { makeIterableIterator } from "./shared/makeIterableIterator.ts";

/**
 * Creates an iterator that is immediately exhausted.
 *
 * Several helpers return this instead of special-casing an empty result — for example `drop`
 * returns it when asked to drop an infinite number of elements.
 *
 * @returns An empty iterator.
 *
 * @example
 * ```typescript
 * console.log([...empty()]);
 * // Output: []
 * ```
 *
 * @since 1.0.0
 */
export function empty<
	const ElementType = never,
>(): IterableIterator<ElementType> {
	return makeIterableIterator<ElementType>(() => ({
		done: true,
		value: undefined,
	}));
}
