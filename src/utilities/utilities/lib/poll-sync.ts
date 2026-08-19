import type { SyncPollOptions } from "@types";
import { sleepSync } from "./sleep-sync.ts";

const DOMExceptionCtor: typeof globalThis.DOMException =
	globalThis.DOMException ??
	// DOMException only became a global in older Node versions relatively recently; fall back to
	// the constructor an aborted AbortSignal already carries.
	AbortSignal.abort().reason.constructor;

/**
 * Repeatedly calls `callback` and checks its result with `condition`, until `condition` returns
 * `true` or the overall timeout elapses.
 *
 * For an asynchronous variant, see {@link poll}.
 *
 * @param callback The function to call on each attempt.
 * @param condition Given the result of `callback`, returns `true` to stop polling.
 * @param options Tuning for retries, delay between attempts, and the overall timeout.
 * @returns The result of `callback` as soon as `condition` accepts it.
 * @throws An `AbortError` `DOMException` if `options.timeout` is reached, or a `TypeError`/`RangeError`
 * if the option values fail validation.
 *
 * @since 1.0.0
 */
export function pollSync<T>(
	callback: () => T,
	condition: (value: T) => boolean,
	options: SyncPollOptions = {},
): T {
	const timeout = options.timeout ?? Infinity;
	if (typeof timeout !== "number")
		throw new TypeError("Expected timeout to be a number");
	if (!(timeout >= 0))
		throw new RangeError("Expected timeout to be a non-negative number");

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

	const deadline = Date.now() + timeout;
	let result = callback();
	for (
		let attempt = 0;
		attempt < maximumRetries && !condition(result);
		attempt++
	) {
		if (Date.now() + waitBetweenRetries > deadline)
			throw new DOMExceptionCtor("This operation was aborted", "AbortError");
		if (waitBetweenRetries > 0) {
			if (options.verbose)
				console.log(`Waiting ${waitBetweenRetries}ms before polling again...`);
			sleepSync(waitBetweenRetries);
		}

		result = callback();
	}

	return result;
}
