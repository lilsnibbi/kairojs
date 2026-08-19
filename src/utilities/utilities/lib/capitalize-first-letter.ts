/**
 * Uppercases the first character of a string and leaves the rest untouched.
 *
 * Unlike {@link toTitleCase}, this does not lowercase the remainder of the string.
 *
 * @param text The text to transform.
 * @returns `text` with its first character capitalized.
 *
 * @example
 * ```typescript
 * capitalizeFirstLetter("hello world"); // "Hello world"
 * ```
 *
 * @since 1.0.0
 */
export function capitalizeFirstLetter(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
