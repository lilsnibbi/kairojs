/**
 * Calls a synchronous callback repeatedly until it returns without throwing, or the retry budget
 * runs out.
 *
 * For an asynchronous variant, see {@link retry}.
 *
 * @param callback The function to retry.
 * @param retries The maximum number of attempts, minimum `0`.
 * @returns The return value of the first successful attempt.
 * @throws The last error thrown by `callback`, once every attempt has failed.
 *
 * @since 1.0.0
 */
export function retrySync<T>(callback: () => T, retries: number): T {
	if (retries < 0) throw new RangeError("Expected retries to be a number >= 0");
	if (retries === 0) return callback();

	let lastError: unknown;
	for (let attempt = 0; attempt < retries; ++attempt) {
		try {
			return callback();
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}
