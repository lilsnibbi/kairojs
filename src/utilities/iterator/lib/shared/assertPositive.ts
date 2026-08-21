/**
 * Guards a numeric argument, throwing when it is not strictly positive.
 *
 * Used by the helpers whose numeric argument is a size that must never be zero (`chunk`,
 * `windows`, `stepBy`, …), since a zero-sized chunk or window has no sensible meaning.
 *
 * @param value The already-normalised number to check.
 * @param original The original, pre-normalisation value — used only for the error message.
 * @returns `value`, unchanged, for convenient assignment at the call site.
 *
 * @internal
 */
export function assertPositive(value: number, original: unknown): number {
	if (value <= 0) {
		throw new RangeError(`${original} must be a positive number`);
	}

	return value;
}
