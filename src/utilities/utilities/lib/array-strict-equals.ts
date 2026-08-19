/**
 * Compares two arrays for strict equality: same length, and every element strictly equal (`===`)
 * to its counterpart at the same index, including matching `typeof`.
 *
 * @param first The array to compare.
 * @param second The array to compare against.
 * @returns `true` if both arrays contain the same values in the same order.
 *
 * @since 1.0.0
 */
export function arrayStrictEquals<T extends readonly unknown[]>(
	first: T,
	second: T,
): boolean {
	if (first === second) return true;
	if (first.length !== second.length) return false;

	for (let index = 0; index < first.length; index++) {
		if (
			first[index] !== second[index] ||
			typeof first[index] !== typeof second[index]
		)
			return false;
	}

	return true;
}
