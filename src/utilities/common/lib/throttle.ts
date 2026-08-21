import type { ThrottleFn } from "@types";

/**
 * Wraps a function so it can be invoked at most once per `wait` milliseconds — calls made before
 * the cooldown elapses return the previous call's result instead of invoking `callback` again.
 *
 * The returned function's `flush` method resets the cooldown, so the very next call runs
 * `callback` immediately.
 *
 * @param callback The function to throttle.
 * @param wait The minimum number of milliseconds between invocations.
 * @returns The throttled wrapper, sharing `callback`'s call signature plus a `flush` method.
 *
 * @since 1.0.0
 */
export function throttle<T extends (...args: any[]) => any>(
	callback: T,
	wait: number,
): ThrottleFn<T> {
	let lastInvokeTime = 0;
	let lastResult: ReturnType<T>;

	return Object.assign(
		(...args: Parameters<T>) => {
			const now = Date.now();
			if (now - lastInvokeTime > wait) {
				lastInvokeTime = now;
				lastResult = callback(...args);
				return lastResult;
			}

			return lastResult;
		},
		{
			flush() {
				lastInvokeTime = 0;
			},
		},
	) as ThrottleFn<T>;
}
