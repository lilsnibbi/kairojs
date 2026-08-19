import type { Awaitable, PollOptions } from "@types";
import { sleep } from "./sleep.ts";

/**
 * Repeatedly calls `callback` and checks its result with `condition`, until `condition` returns
 * `true` or the retry budget is exhausted.
 *
 * For a synchronous variant, see {@link pollSync}.
 *
 * @param callback The function to call on each attempt.
 * @param condition Given the result of `callback`, returns `true` to stop polling.
 * @param options Tuning for retries, delay between attempts, and cancellation.
 * @returns The result of `callback` as soon as `condition` accepts it.
 * @throws If the abort signal fires, or if the option values fail validation.
 *
 * @since 1.0.0
 */
export async function poll<T>(
	callback: (signal: AbortSignal | undefined) => Awaitable<T>,
	condition: (
		value: Awaited<T>,
		signal: AbortSignal | undefined,
	) => Awaitable<boolean>,
	options: PollOptions = {},
): Promise<Awaitable<T>> {
	const signal = options.signal ?? undefined;

	const maximumRetries = options.maximumRetries ?? Infinity;
	if (typeof maximumRetries !== "number")
		throw new TypeError("Expected maximumRetries to be a number");
	if (!(maximumRetries >= 0))
		throw new RangeError("Expected maximumRetries to be a non-negative number");

	const waitBetweenRetries = options.waitBetweenRetries ?? 0;
	if (typeof waitBetweenRetries !== "number")
		throw new TypeError("Expected waitBetweenRetries to be a number");
	if (!Number.isSafeInteger(waitBetweenRetries) || waitBetweenRetries < 0) {
		throw new RangeError(
			"Expected waitBetweenRetries to be a positive safe integer",
		);
	}

	signal?.throwIfAborted();
	let result = await callback(signal);
	for (
		let attempt = 0;
		attempt < maximumRetries && !(await condition(result, signal));
		attempt++
	) {
		signal?.throwIfAborted();

		if (waitBetweenRetries > 0) {
			if (options.verbose)
				console.log(`Waiting ${waitBetweenRetries}ms before polling again...`);
			await sleep(waitBetweenRetries, undefined, { signal });
		}

		result = await callback(signal);
	}

	return result;
}
