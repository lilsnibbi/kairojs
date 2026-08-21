/**
 * Attempts to parse a JSON string, returning the original string unchanged if parsing fails
 * instead of throwing.
 *
 * @param value The string to parse.
 * @param reviver Transforms each parsed member; forwarded directly to {@link JSON.parse}.
 * @returns The parsed value, or `value` itself if it was not valid JSON.
 *
 * @since 1.0.0
 */
export function tryParseJSON(
	value: string,
	reviver?: (this: object, key: string, value: unknown) => unknown,
): object | string | number | boolean | null {
	try {
		return JSON.parse(value, reviver);
	} catch {
		return value;
	}
}
