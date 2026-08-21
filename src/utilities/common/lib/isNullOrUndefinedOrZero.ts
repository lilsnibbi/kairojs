import type { Nullish } from "@types";
import { isNullish } from "./isNullOrUndefined.ts";

/**
 * Checks whether a value is `null`, `undefined`, or `0`.
 *
 * @param value The value to check.
 *
 * @since 1.0.0
 */
export function isNullOrUndefinedOrZero(value: unknown): value is Nullish | 0 {
	return value === 0 || isNullish(value);
}

export { isNullOrUndefinedOrZero as isNullishOrZero };
