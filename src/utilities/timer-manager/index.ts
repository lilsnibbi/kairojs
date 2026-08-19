/**
 * Tracks every timer it creates so they can all be cleared at once, letting the process exit
 * cleanly instead of hanging on a pending `setInterval`.
 *
 * @since 1.0.0
 */
export class TimerManager extends null {
	/**
	 * Timeouts created through this class that have not fired or been cleared yet.
	 */
	static #timeouts = new Set<ReturnType<typeof setTimeout>>();

	/**
	 * Intervals created through this class that have not been cleared yet.
	 */
	static #intervals = new Set<ReturnType<typeof setInterval>>();

	/**
	 * Schedules a callback and tracks it so {@link TimerManager.destroy} can cancel it.
	 *
	 * @param callback The function to run once the delay elapses.
	 * @param delay How long to wait, in milliseconds.
	 * @param args Extra arguments forwarded to the callback.
	 */
	public static setTimeout<A = unknown>(
		callback: (...args: A[]) => void,
		delay: number,
		...args: A[]
	) {
		const timeout = setTimeout(() => {
			TimerManager.#timeouts.delete(timeout);
			callback(...args);
		}, delay);

		TimerManager.#timeouts.add(timeout);
		return timeout;
	}

	/**
	 * Cancels a timeout created through {@link TimerManager.setTimeout} and stops tracking it.
	 *
	 * @param timeout The timeout to cancel.
	 */
	public static clearTimeout(timeout: ReturnType<typeof setTimeout>): void {
		clearTimeout(timeout);
		TimerManager.#timeouts.delete(timeout);
	}

	/**
	 * Schedules a repeating callback and tracks it so {@link TimerManager.destroy} can cancel it.
	 *
	 * @param callback The function to run on every tick.
	 * @param delay How long to wait between ticks, in milliseconds.
	 * @param args Extra arguments forwarded to the callback.
	 */
	public static setInterval<A = unknown>(
		callback: (...args: A[]) => void,
		delay: number,
		...args: A[]
	) {
		const interval = setInterval(callback, delay, ...args);
		TimerManager.#intervals.add(interval);
		return interval;
	}

	/**
	 * Cancels an interval created through {@link TimerManager.setInterval} and stops tracking it.
	 *
	 * @param interval The interval to cancel.
	 */
	public static clearInterval(interval: ReturnType<typeof setInterval>): void {
		clearInterval(interval);
		TimerManager.#intervals.delete(interval);
	}

	/**
	 * Cancels every timeout and interval created through this class so the process can exit.
	 */
	public static destroy(): void {
		for (const timeout of TimerManager.#timeouts) clearTimeout(timeout);
		for (const interval of TimerManager.#intervals) clearInterval(interval);
		TimerManager.#timeouts.clear();
		TimerManager.#intervals.clear();
	}
}
