import type { IterableResolvable } from "@types";
import { assertFunction } from "./shared/assert-function.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Drains the iterable, folding every element into a single accumulated result.
 *
 * @param iterable The iterator to reduce.
 * @param callbackFn A function to execute for each element. Its return value becomes the
 * `accumulator` for the next call, and the final call's return value is the result.
 * @param initialValue The starting value of `accumulator`. When omitted, the first element is
 * used as the initial accumulator and the callback starts from the second element — in that case,
 * an empty iterator throws instead of returning a value.
 *
 * @example
 * ```typescript
 * console.log(reduce([1, 2, 3, 4, 5], (accumulator, currentValue) => accumulator + currentValue));
 * // Output: 15
 * ```
 *
 * @remarks
 *
 * This function consumes the entire iterator.
 *
 * @since 1.0.0
 */
export function reduce<const ElementType, const MappedType>(
	iterable: IterableResolvable<ElementType>,
	callbackFn: (
		accumulator: MappedType,
		currentValue: ElementType,
		currentIndex: number,
	) => MappedType,
	...initialValueArguments: [] | [initialValue: MappedType]
): MappedType {
	callbackFn = assertFunction(callbackFn);

	let index: number;
	let accumulator: MappedType;
	const resolvedIterable = toIterableIterator(iterable);
	if (initialValueArguments.length === 0) {
		const firstValue = resolvedIterable.next();
		if (firstValue.done)
			throw new TypeError("Reduce of empty iterator with no initial value");

		index = 1;
		accumulator = firstValue.value! as MappedType;
	} else {
		index = 0;
		accumulator = initialValueArguments[0];
	}

	for (const value of resolvedIterable) {
		accumulator = callbackFn(accumulator, value, index++);
	}

	return accumulator;
}
