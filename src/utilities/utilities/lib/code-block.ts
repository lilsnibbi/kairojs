const zeroWidthSpace = String.fromCharCode(8203);

/**
 * Wraps text in a markdown codeblock with no language tag.
 *
 * If the content contains three consecutive backticks they are escaped by inserting a
 * [zero-width space](https://en.wikipedia.org/wiki/Zero-width_space) between the first and second
 * one, and a trailing backtick gets a zero-width space appended, so the wrapping fence can never
 * be broken out of.
 *
 * @param content The content to wrap.
 *
 * @since 1.0.0
 */
export function codeBlock<C extends string>(content: C): `\`\`\`\n${C}\n\`\`\``;
/**
 * Wraps text in a markdown codeblock tagged with the given language.
 *
 * If the content contains three consecutive backticks they are escaped by inserting a
 * [zero-width space](https://en.wikipedia.org/wiki/Zero-width_space) between the first and second
 * one, and a trailing backtick gets a zero-width space appended, so the wrapping fence can never
 * be broken out of.
 *
 * @param language The codeblock's language tag.
 * @param content The content to wrap.
 *
 * @since 1.0.0
 */
export function codeBlock<L extends string, C extends string>(
	language: L,
	content: C,
): `\`\`\`${L}\n${C}\n\`\`\``;
export function codeBlock(...args: [string, string?]): string {
	const [language, content] = args.length === 1 ? ["", args[0]] : args;
	return `\`\`\`${language}\n${String(content).replace(/```/, `\`${zeroWidthSpace}\`\``).replace(/`$/g, `\`${zeroWidthSpace}`)}\n\`\`\``;
}
