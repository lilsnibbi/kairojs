import { assertNotNegative } from "./shared/assertNotNegative.ts";
import { makeIterableIterator } from "./shared/makeIterableIterator.ts";
import { toNumberOrThrow } from "./shared/toNumberOrThrow.ts";

/**
 * Creates an iterable that yields the same value `count` times.
 *
 * @param value The value to be repeated.
 * @param count The number of times to repeat the value.
 *
 * @example
 * ```typescript
 * console.log([...repeat("Hello, world!", 3)]);
 * // Output: ['Hello, world!', 'Hello, world!', 'Hello, world!']
 * ```
 *
 * @remarks
 *
 * `value` is not cloned — every yielded element is the exact same reference.
 *
 * @since 1.0.0
 */
export function repeat<const ElementType>(
	value: ElementType,
	count: number,
): IterableIterator<ElementType> {
	count = assertNotNegative(toNumberOrThrow(count), count);

	let index = 0;
	return makeIterableIterator<ElementType>(() => {
		if (index >= count) return { done: true, value: undefined };

		index++;
		return { done: false, value };
	});
}
