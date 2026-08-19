/**
 * Checks whether any of the given keys is present in a map.
 *
 * @param map The map to check.
 * @param keys The keys to look for.
 * @returns `true` if at least one of `keys` is present in `map`.
 *
 * @since 1.0.0
 */
export function hasAtLeastOneKeyInMap<T>(
	map: ReadonlyMap<T, any>,
	keys: readonly T[],
): boolean {
	return keys.some((key) => map.has(key));
}
