import type { Awaitable } from "@types";

/**
 * Calls an asynchronous callback repeatedly until it resolves without throwing, or the retry
 * budget runs out.
 *
 * For a synchronous variant, see {@link retrySync}.
 *
 * @param callback The function to retry.
 * @param retries The maximum number of attempts, minimum `0`.
 * @returns The resolved value of the first successful attempt.
 * @throws The last error thrown by `callback`, once every attempt has failed.
 *
 * @since 1.0.0
 */
export async function retry<T>(
	callback: () => Awaitable<T>,
	retries: number,
): Promise<T> {
	if (retries < 0) throw new RangeError("Expected retries to be a number >= 0");
	if (retries === 0) return callback();

	let lastError: unknown;
	for (let attempt = 0; attempt < retries; ++attempt) {
		try {
			return await callback();
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}
