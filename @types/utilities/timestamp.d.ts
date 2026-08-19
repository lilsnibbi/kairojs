/**
 * Anything {@link Timestamp} can resolve into a concrete date.
 *
 * @since 1.0.0
 */
export type TimeResolvable = Date | number | string;

/**
 * One piece of a parsed {@link Timestamp} pattern: either a literal chunk of text, or a token that
 * still needs to be resolved against a date.
 *
 * @since 1.0.0
 */
export interface TimestampTemplateEntry {
	/**
	 * The token this entry represents, or `"literal"` when {@link TimestampTemplateEntry.content}
	 * should be emitted verbatim.
	 */
	type: string;

	/**
	 * The literal text to emit, or `null` when {@link TimestampTemplateEntry.type} must be resolved
	 * against a date instead.
	 */
	content: string | null;
}

/**
 * A function that renders a single {@link Timestamp} token against a resolved date.
 *
 * @since 1.0.0
 */
export type TimestampTokenResolver = (time: Date) => string;
