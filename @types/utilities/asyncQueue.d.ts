/**
 * Options accepted by `AsyncQueue#wait`.
 *
 * @since 1.0.0
 */
export interface AsyncQueueWaitOptions {
	/**
	 * Aborting this signal removes the caller from the queue and rejects the promise returned by
	 * `wait`. Signals that have already aborted are ignored.
	 */
	signal?: AbortSignal | undefined | null;
}
