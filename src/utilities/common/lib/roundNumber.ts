/**
 * Rounds a number to a fixed number of decimal places.
 *
 * @param input The number (or numeric string) to round.
 * @param decimals How many decimal places to keep.
 *
 * @since 1.0.0
 */
export function roundNumber(input: number | string, decimals = 0): number {
	const value = Number(input);

	if (decimals === 0) {
		return Math.round(value);
	}

	const scale = 10 ** decimals;
	return Math.round(value * scale) / scale;
}
