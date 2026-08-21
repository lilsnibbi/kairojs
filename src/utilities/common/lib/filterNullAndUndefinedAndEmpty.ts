import type { Nullish } from "@types";
import { isNullOrUndefinedOrEmpty } from "./isNullOrUndefinedOrEmpty.ts";

/**
 * Checks that a value is neither `null`, `undefined`, nor an empty string/array. Designed to be
 * passed directly to {@link Array.filter} so the array's element type narrows accordingly.
 *
 * @param value The value to check.
 * @returns `true` if `value` is neither `null`, `undefined`, nor `""`.
 *
 * @example
 * ```typescript
 * const values: (string | undefined | null)[] = ["one", "two", undefined, null, ""];
 * const filtered: string[] = values.filter(filterNullAndUndefinedAndEmpty);
 * // ["one", "two"]
 * ```
 *
 * @since 1.0.0
 */
export function filterNullAndUndefinedAndEmpty<TValue>(
	value: TValue | Nullish | "",
): value is TValue {
	return !isNullOrUndefinedOrEmpty(value);
}

export { filterNullAndUndefinedAndEmpty as filterNullishAndEmpty };
