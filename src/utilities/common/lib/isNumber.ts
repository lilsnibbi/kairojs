/**
 * Checks whether a value is a finite number, coercing strings first.
 *
 * @param input The value to check. Strings are converted with {@link Number} before the check.
 * @returns `true` if `input` (or its numeric conversion) is a finite, non-`NaN` number.
 *
 * @since 1.0.0
 */
export function isNumber(input: unknown): input is number {
	const value = typeof input === "string" ? Number(input) : input;
	return (
		typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
	);
}
