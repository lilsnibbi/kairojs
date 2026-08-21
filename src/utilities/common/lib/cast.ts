/**
 * Casts a value to type `T` without any runtime check.
 *
 * This purely narrows the type as seen by the compiler — it performs no validation or conversion,
 * and using it on a value that is not actually a `T` will lead to runtime errors down the line.
 * It only has meaning in TypeScript; in plain JavaScript it is a no-op identity function.
 *
 * @param value The value to cast.
 * @returns The same value, typed as `T`.
 *
 * @since 1.0.0
 */
export function cast<T>(value: unknown): T {
	return value as T;
}
