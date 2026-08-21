const wordSeparatorCharacter = /[\p{Separator}\p{Punctuation}\p{Control}]/u;

/**
 * Truncates a string to at most `length` codepoints, breaking at the last separator character
 * found within that range and appending an ellipsis, so words are never cut in half.
 *
 * @param text The text to truncate.
 * @param length The maximum desired length, in codepoints.
 * @returns `text` unchanged if it already fits, otherwise a truncated copy ending in `…`.
 *
 * @since 1.0.0
 */
export function cutText(text: string, length: number): string {
	if (text.length <= length) return text;

	const codepoints = [...text];
	if (codepoints.length <= length) return text;

	let lastSeparatorIndex = length;
	for (let index = 0; index < length; ++index) {
		if (wordSeparatorCharacter.test(codepoints[index]!)) {
			lastSeparatorIndex = index;
		}
	}

	const cutoffIndex =
		lastSeparatorIndex === length ? length - 1 : lastSeparatorIndex;
	return codepoints.slice(0, cutoffIndex).concat("…").join("");
}
