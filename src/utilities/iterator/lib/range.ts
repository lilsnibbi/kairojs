import { toNumberOrThrow } from "./shared/toNumberOrThrow.ts";

/**
 * Creates an iterable over the numbers from `start` up to (but excluding) `end`, moving by `step`
 * each time.
 *
 * @param start The first number in the range.
 * @param end The exclusive end of the range.
 * @param step The amount to increment (or decrement) by. Defaults to `1` when `start < end`, and
 * `-1` otherwise.
 *
 * @example
 * ```typescript
 * console.log([...range(0, 5)]);
 * // Output: [0, 1, 2, 3, 4]
 *
 * console.log([...range(5, 0)]);
 * // Output: [5, 4, 3, 2, 1]
 *
 * console.log([...range(0, 5, 2)]);
 * // Output: [0, 2, 4]
 * ```
 *
 * @since 1.0.0
 */
export function* range(
	start: number,
	end: number,
	step?: number | undefined,
): IterableIterator<number> {
	start = toNumberOrThrow(start);
	end = toNumberOrThrow(end);

	if (step === undefined) {
		step = start < end ? 1 : -1;
	} else {
		step = toNumberOrThrow(step);

		if (step === 0) {
			throw new RangeError("Step cannot be zero");
		}

		if (step > 0 && start > end) {
			throw new RangeError("Start must be less than end when step is positive");
		} else if (step < 0 && start < end) {
			throw new RangeError(
				"Start must be greater than end when step is negative",
			);
		}
	}

	if (start < end) {
		for (let value = start; value < end; value += step) {
			yield value;
		}
	} else {
		for (let value = start; value > end; value += step) {
			yield value;
		}
	}
}
