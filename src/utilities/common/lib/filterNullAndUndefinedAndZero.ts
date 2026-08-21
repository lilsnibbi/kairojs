import type { Nullish } from "@types";
import { isNullOrUndefinedOrZero } from "./isNullOrUndefinedOrZero.ts";

/**
 * Checks that a value is neither `null`, `undefined`, nor `0`. Designed to be passed directly to
 * {@link Array.filter} so the array's element type narrows accordingly.
 *
 * @param value The value to check.
 * @returns `true` if `value` is neither `null`, `undefined`, nor `0`.
 *
 * @example
 * ```typescript
 * const values: (string | number | undefined | null)[] = ["one", "two", undefined, null, 0, 1];
 * const filtered: (string | number)[] = values.filter(filterNullAndUndefinedAndZero);
 * // ["one", "two", 1]
 * ```
 *
 * @since 1.0.0
 */
export function filterNullAndUndefinedAndZero<TValue>(
	value: TValue | Nullish | 0,
): value is TValue {
	return !isNullOrUndefinedOrZero(value);
}

export { filterNullAndUndefinedAndZero as filterNullishAndZero };
