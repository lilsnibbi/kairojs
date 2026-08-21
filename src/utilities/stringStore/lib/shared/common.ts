/**
 * Reports whether the given value looks array-like: an object with a valid, non-negative,
 * safe-integer `length` and either an entry at its last index or a length of zero.
 *
 * `Array.isArray` alone would reject the plain arrays some {@link IType} implementations build
 * for a value before it is known to be an actual `Array` instance, so this checks structurally
 * instead.
 *
 * @param object The value to check.
 *
 * @since 1.0.0
 */
export function isArrayLike(object: unknown): object is ArrayLike<unknown> {
	// Anything that is not an object cannot be array-like:
	if (!isObject(object)) return false;
	// An actual array always qualifies:
	if (Array.isArray(object)) return true;
	// Without a numeric `length`, it cannot be array-like:
	if (!hasLength(object)) return false;
	// An invalid length rules it out:
	if (!isValidLength(object.length)) return false;

	return object.length === 0 || object.length - 1 in object;
}

/**
 * Reports whether the given value is a non-null object.
 *
 * @param item The value to check.
 */
function isObject(item: unknown): item is object {
	return typeof item === "object" && item !== null;
}

/**
 * Reports whether the given object has a numeric `length` property.
 *
 * @param item The object to check.
 */
function hasLength(item: object): item is { length: number } {
	return "length" in item && typeof item.length === "number";
}

/**
 * Reports whether the given number is usable as a buffer or array length: a safe, non-negative
 * integer below 2^31.
 *
 * @param length The number to check.
 *
 * @since 1.0.0
 */
export function isValidLength(length: number): boolean {
	return Number.isSafeInteger(length) && length >= 0 && length < 2_147_483_648;
}
