import type { NumberResolvable } from "@types";

/**
 * Coerces a {@link NumberResolvable} value into a `number`, throwing for values that cannot be
 * meaningfully converted.
 *
 * This mirrors the abstract `ToNumber` operation the language spec uses internally, except that
 * `bigint`, `symbol`, `undefined`, and `NaN` results are rejected outright rather than silently
 * producing a useless number.
 *
 * @param value The value to convert to a number.
 * @returns The numeric value.
 *
 * @internal
 */
export function toNumberOrThrow(value: NumberResolvable): number {
	switch (typeof value) {
		case "bigint":
			throw new TypeError("Cannot convert a BigInt value to a number");
		case "symbol":
			throw new TypeError("Cannot convert a Symbol value to a number");
		case "boolean":
			return value ? 1 : 0;
		case "number":
			return assertNumber(value, value);
		case "undefined":
			throw new TypeError("Cannot convert an undefined value to a number");
		default:
			return assertNumber(Number(value), value);
	}
}

function assertNumber(value: number, original: unknown): number {
	if (Number.isNaN(value)) {
		throw new RangeError(`${original} must be a non-NaN number`);
	}

	return value;
}
