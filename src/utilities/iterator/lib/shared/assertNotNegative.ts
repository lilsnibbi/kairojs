/**
 * Guards a numeric argument, throwing when it is negative.
 *
 * Used by the helpers that treat their numeric argument as a count of elements (`drop`, `take`,
 * `at`, …), where a negative count has no sensible meaning.
 *
 * @param value The already-normalised number to check.
 * @param original The original, pre-normalisation value — used only for the error message.
 * @returns `value`, unchanged, for convenient assignment at the call site.
 *
 * @internal
 */
export function assertNotNegative(value: number, original: unknown): number {
	if (value < 0) {
		throw new RangeError(`${original} must be a non-negative number`);
	}

	return value;
}
