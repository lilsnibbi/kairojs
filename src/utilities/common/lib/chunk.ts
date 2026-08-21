/**
 * Splits an array into consecutive chunks of a fixed size, with the final chunk holding whatever
 * remains.
 *
 * @param array The array to split up.
 * @param chunkSize How many elements each chunk should hold.
 * @returns An array of chunks.
 * @throws {TypeError} If `array` is not an array, or `chunkSize` is not an integer.
 * @throws {RangeError} If `chunkSize` is less than `1`.
 *
 * @since 1.0.0
 */
export function chunk<T>(array: readonly T[], chunkSize: number): T[][] {
	if (!Array.isArray(array)) throw new TypeError("entries must be an array.");
	if (!Number.isInteger(chunkSize))
		throw new TypeError("chunkSize must be an integer.");
	if (chunkSize < 1) throw new RangeError("chunkSize must be 1 or greater.");

	const chunks: T[][] = [];
	for (let index = 0; index < array.length; index += chunkSize) {
		chunks.push(array.slice(index, index + chunkSize));
	}

	return chunks;
}
