import { toNumberOrThrow } from "./to-number-or-throw.ts";

/**
 * Coerces a value into a finite integer, throwing when it resolves to positive or negative
 * infinity.
 *
 * Used by helpers whose numeric argument must be usable as an actual element count, where an
 * infinite value could never be satisfied (`chunk`, `tee`, …).
 *
 * @param value The value to convert to an integer.
 * @returns The integer value.
 *
 * @internal
 */
export function toIntegerOrThrow(value: number): number {
	const number = toNumberOrThrow(value);
	if (Number.isNaN(number) || number === 0) return 0;
	if (number === Number.POSITIVE_INFINITY)
		throw new RangeError("+Infinity cannot be represented as an integer");
	if (number === Number.NEGATIVE_INFINITY)
		throw new RangeError("-Infinity cannot be represented as an integer");

	return Math.trunc(number);
}
