const zeroWidthSpace = String.fromCharCode(8203);

/**
 * Wraps text in a markdown inline codeblock, escaping it so the content cannot break out of the
 * surrounding backticks: spaces become non-breaking spaces and any backtick in the content gets a
 * [zero-width space](https://en.wikipedia.org/wiki/Zero-width_space) inserted after it.
 *
 * @param content The content to wrap.
 * @returns `content` wrapped in backticks.
 *
 * @since 1.0.0
 */
export function inlineCodeBlock<C extends string>(content: C): `\`${C}\`` {
	let escaped = content.replace(/ /g, " ") as C;
	escaped = escaped.replace(/`/g, `\`${zeroWidthSpace}`) as C;

	return `\`${escaped}\``;
}
