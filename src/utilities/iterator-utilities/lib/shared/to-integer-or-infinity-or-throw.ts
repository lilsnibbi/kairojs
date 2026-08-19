import { toNumberOrThrow } from "./to-number-or-throw.ts";

/**
 * Coerces a value into an integer, allowing positive and negative infinity through unchanged.
 *
 * Used by helpers whose numeric argument may legitimately be infinite (`drop(iterable,
 * Infinity)` empties the iterable, `take(iterable, Infinity)` returns it untouched, …), unlike
 * {@link toIntegerOrThrow} which rejects infinite values outright.
 *
 * @param value The value to convert to an integer.
 * @returns The integer value, or `Number.POSITIVE_INFINITY` / `Number.NEGATIVE_INFINITY`.
 *
 * @internal
 */
export function toIntegerOrInfinityOrThrow(value: number): number {
	const number = toNumberOrThrow(value);
	if (Number.isNaN(number) || number === 0) return 0;
	if (number === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
	if (number === Number.NEGATIVE_INFINITY) return Number.NEGATIVE_INFINITY;

	return Math.trunc(number);
}
