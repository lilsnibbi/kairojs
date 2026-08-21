/**
 * Converts `snake_case` (or `kebab-case`) text to `camelCase`.
 *
 * @param text The text to transform.
 * @returns `text` converted to camel case.
 *
 * @example
 * ```typescript
 * snakeToCamelCase("hello_world"); // "helloWorld"
 * ```
 *
 * @since 1.0.0
 */
export function snakeToCamelCase(text: string): string {
	return text
		.toLowerCase()
		.replace(/([-_][a-z])/g, (group: string) => group.slice(1).toUpperCase());
}

export { snakeToCamelCase as kebabToCamelCase };
