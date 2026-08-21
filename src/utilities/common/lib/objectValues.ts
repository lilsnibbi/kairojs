/**
 * A typed wrapper around {@link Object.values} that preserves the value type of `obj` instead of
 * widening it to `any`.
 *
 * @param object The object to get values from.
 *
 * @since 1.0.0
 */
export function objectValues<T extends object>(
	object: T,
): T extends ArrayLike<infer Values> ? Values[] : T[keyof T][] {
	return Object.values(object) as T extends ArrayLike<infer Values>
		? Values[]
		: T[keyof T][];
}
