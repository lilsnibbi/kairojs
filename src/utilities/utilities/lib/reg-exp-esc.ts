const REGEXP_SPECIAL_CHARACTERS = /[-/\\^$*+?.()|[\]{}]/g;

/**
 * Escapes every character in a string that has special meaning in a regular expression, so the
 * string can be safely embedded inside a `RegExp` pattern as a literal match.
 *
 * @param text The text to escape.
 *
 * @since 1.0.0
 */
export function regExpEsc(text: string): string {
	return text.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&");
}
