/**
 * Blocks the current thread for a given number of milliseconds, then returns.
 *
 * This busy-waits on wall-clock time rather than CPU ticks, so unlike {@link sleep} its precision
 * is near-absolute — but nothing else on the thread runs for the duration of the wait, so it
 * should be used sparingly.
 *
 * For an asynchronous variant, see {@link sleep}.
 *
 * @param ms How many milliseconds to block for.
 * @param value The value to return once the wait is over.
 * @see {@link sleep} for an asynchronous version.
 *
 * @since 1.0.0
 */
export function sleepSync<T = undefined>(ms: number, value?: T): T {
	const deadline = Date.now() + ms;
	while (Date.now() < deadline);
	return value!;
}
