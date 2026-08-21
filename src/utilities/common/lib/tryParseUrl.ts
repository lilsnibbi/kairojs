/**
 * Attempts to parse a string as a {@link URL}, returning `null` instead of throwing when it is not
 * a valid URL.
 *
 * @param value The candidate URL string.
 * @returns A `URL` instance, or `null` if `value` could not be parsed.
 *
 * @since 1.0.0
 */
export function tryParseURL(value: string): URL | null {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}
