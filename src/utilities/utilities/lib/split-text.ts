/**
 * Truncates a string to `length` characters, backing up to the last occurrence of `char` within
 * that range so the cut does not land in the middle of a word.
 *
 * @param text The text to split.
 * @param length The maximum desired length.
 * @param char The character to split on.
 *
 * @since 1.0.0
 */
export function splitText(text: string, length: number, char = " "): string {
	const searchIndex = text.substring(0, length).lastIndexOf(char);
	const cutoffIndex = searchIndex === -1 ? length : searchIndex;
	return text.substring(0, cutoffIndex);
}
