/**
 * A typed wrapper around {@link Object.entries} that preserves the key and value types of `obj`
 * instead of widening them to `string`/`any`.
 *
 * @param object The object to get entries from.
 *
 * @since 1.0.0
 */
export function objectEntries<T extends object>(
	object: T,
): T extends ArrayLike<infer Values>
	? [`${number}`, Values][]
	: [keyof T, T[keyof T]][] {
	return Object.entries(object) as T extends ArrayLike<infer Values>
		? [`${number}`, Values][]
		: [keyof T, T[keyof T]][];
}
