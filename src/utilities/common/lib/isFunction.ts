/**
 * Checks whether a value is a function.
 *
 * @param input The value to check.
 *
 * @since 1.0.0
 */
// biome-ignore lint/complexity/noBannedTypes: the guard narrows to any callable, which is what Function means here
export function isFunction(input: unknown): input is Function {
	return typeof input === "function";
}
