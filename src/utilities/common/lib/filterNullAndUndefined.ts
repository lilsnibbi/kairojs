import type { Nullish } from "@types";
import { isNullish } from "./isNullOrUndefined.ts";

/**
 * Checks that a value is neither `null` nor `undefined`. Designed to be passed directly to
 * {@link Array.filter} so the array's element type narrows accordingly.
 *
 * @param value The value to check.
 * @returns `true` if `value` is neither `null` nor `undefined`.
 *
 * @example
 * ```typescript
 * const values: (string | undefined | null)[] = ["one", "two", undefined, null, "five"];
 * const filtered: string[] = values.filter(filterNullAndUndefined);
 * // ["one", "two", "five"]
 * ```
 *
 * @since 1.0.0
 */
export function filterNullAndUndefined<TValue>(
	value: TValue | Nullish,
): value is TValue {
	return !isNullish(value);
}

export { filterNullAndUndefined as filterNullish };
