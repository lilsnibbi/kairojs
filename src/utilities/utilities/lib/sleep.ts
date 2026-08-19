import type { SleepOptions } from "@types";

/**
 * Resolves after a given number of milliseconds.
 *
 * For a synchronous variant, see {@link sleepSync}.
 *
 * @param ms How many milliseconds to wait.
 * @param value The value the returned promise resolves with.
 * @param options Optionally carries an {@link AbortSignal} to cancel the wait early, and a `ref`
 * flag controlling whether the pending timer keeps the event loop alive.
 * @see {@link sleepSync} for a synchronous version.
 *
 * @since 1.0.0
 */
export function sleep<T = undefined>(
	ms: number,
	value?: T,
	options?: SleepOptions,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const signal = options?.signal;
		if (signal) {
			if (signal.aborted) {
				reject(signal.reason);
				return;
			}

			signal.addEventListener("abort", () => {
				clearTimeout(timer);
				reject(signal.reason);
			});
		}

		const timer: ReturnType<typeof setTimeout> | number = setTimeout(
			() => resolve(value!),
			ms,
		);
		if (options?.ref === false && typeof timer === "object") {
			timer.unref();
		}
	});
}
