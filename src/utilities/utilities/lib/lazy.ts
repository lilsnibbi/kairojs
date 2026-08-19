/**
 * Wraps a callback so its result is computed once, on first call, and cached for every call after
 * that — handy for lazily constructing a constant or loading a module only when it is first
 * needed.
 *
 * @param callback The callback to lazily evaluate.
 * @returns A function that returns the cached value, computing it via `callback` on the first call.
 *
 * @since 1.0.0
 */
export function lazy<T>(callback: () => T): () => T {
	let cachedValue: T;

	return () => (cachedValue ??= callback());
}
