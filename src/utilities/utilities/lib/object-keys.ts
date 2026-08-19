/**
 * A typed wrapper around {@link Object.keys} that preserves the key type of `obj` instead of
 * widening it to `string`.
 *
 * @param object The object to get keys from.
 *
 * @since 1.0.0
 */
export function objectKeys<T extends object>(
	object: T,
): T extends ArrayLike<any> ? `${number}`[] : (keyof T)[] {
	return Object.keys(object) as T extends ArrayLike<any>
		? `${number}`[]
		: (keyof T)[];
}
