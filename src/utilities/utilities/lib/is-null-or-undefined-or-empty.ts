import type { Nullish } from "@types";
import { isNullish } from "./is-null-or-undefined.ts";

/**
 * Checks whether a value is `null`, `undefined`, or has a length of `0` — covering both empty
 * strings and empty arrays.
 *
 * @param value The value to check.
 *
 * @since 1.0.0
 */
export function isNullOrUndefinedOrEmpty(
	value: unknown,
): value is Nullish | "" {
	return isNullish(value) || (value as string | unknown[]).length === 0;
}

export { isNullOrUndefinedOrEmpty as isNullishOrEmpty };
