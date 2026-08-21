import type { Nullish } from "@types";

/**
 * Checks whether a value is `null` or `undefined`.
 *
 * @param value The value to check.
 *
 * @since 1.0.0
 */
export function isNullOrUndefined(value: unknown): value is Nullish {
	return value === undefined || value === null;
}

export { isNullOrUndefined as isNullish };
