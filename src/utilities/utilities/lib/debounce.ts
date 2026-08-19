import type { DebouncedFunc, DebounceSettings } from "@types";

/**
 * Wraps a function so that repeated calls collapse into a single invocation once the caller has
 * stopped calling it for `wait` milliseconds — the trailing edge of the burst.
 *
 * The returned function's `cancel` method discards a pending invocation, and `flush` runs it
 * immediately. If `options.maxWait` is set, an invocation is forced once that much time has passed
 * since the first call of the current burst, even if calls are still coming in.
 *
 * @param callback The function to debounce.
 * @param options Tuning for the delay and the maximum delay.
 * @returns The debounced wrapper, sharing `callback`'s parameters and return type.
 *
 * @since 1.0.0
 */
export function debounce<FnArgumentsType extends any[], FnReturnType>(
	callback: (...args: FnArgumentsType) => FnReturnType,
	options: DebounceSettings = {},
): DebouncedFunc<FnArgumentsType, FnReturnType> {
	let pendingArguments: FnArgumentsType | undefined;
	let lastResult: FnReturnType | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastCallTime: number | undefined;
	let lastInvokeTime = 0;

	const wait = options.wait ?? 0;
	const maxWait =
		typeof options.maxWait === "number"
			? Math.max(options.maxWait, wait)
			: null;

	function invoke(time: number) {
		const args = pendingArguments;

		pendingArguments = undefined;
		lastInvokeTime = time;
		lastResult = callback(...args!);
		return lastResult;
	}

	function startLeadingEdge(time: number) {
		lastInvokeTime = time;
		timer = setTimeout(onTimerExpired, wait);
		return lastResult;
	}

	function remainingWait(time: number) {
		const timeSinceLastCall = time - lastCallTime!;
		const timeSinceLastInvoke = time - lastInvokeTime;
		const remaining = wait - timeSinceLastCall;

		return maxWait === null
			? remaining
			: Math.min(remaining, maxWait - timeSinceLastInvoke);
	}

	function shouldInvoke(time: number) {
		const timeSinceLastCall = time - lastCallTime!;
		const timeSinceLastInvoke = time - lastInvokeTime;

		return (
			lastCallTime === undefined ||
			timeSinceLastCall >= wait ||
			timeSinceLastCall < 0 ||
			(maxWait !== null && timeSinceLastInvoke >= maxWait)
		);
	}

	function onTimerExpired() {
		const time = Date.now();
		if (shouldInvoke(time)) {
			runTrailingEdge(time);
			return;
		}

		timer = setTimeout(onTimerExpired, remainingWait(time));
	}

	function runTrailingEdge(time: number) {
		timer = undefined;
		return invoke(time);
	}

	function cancel() {
		if (timer !== undefined) clearTimeout(timer);

		lastInvokeTime = 0;
		pendingArguments = undefined;
		lastCallTime = undefined;
		timer = undefined;
	}

	function flush() {
		return timer === undefined ? lastResult : runTrailingEdge(Date.now());
	}

	function debounced(...args: FnArgumentsType) {
		const time = Date.now();
		const isInvoking = shouldInvoke(time);

		pendingArguments = args;
		lastCallTime = time;

		if (isInvoking) {
			if (timer === undefined) {
				return startLeadingEdge(lastCallTime);
			}
			if (maxWait !== null) {
				// A tight loop of calls still has to eventually invoke while `maxWait` is set.
				timer = setTimeout(onTimerExpired, wait);
				return invoke(lastCallTime);
			}
		}

		if (timer === undefined) {
			timer = setTimeout(onTimerExpired, wait);
		}

		return lastResult;
	}

	debounced.cancel = cancel;
	debounced.flush = flush;

	return debounced;
}
