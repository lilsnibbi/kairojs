import type { AsyncQueueWaitOptions } from "@types";
import { AsyncQueueEntry } from "./entry.ts";

/**
 * Serialises bursts of asynchronous work so that only one caller runs at a time, each waiting for
 * the previous one to finish.
 *
 * @since 1.0.0
 */
export class AsyncQueue {
	/**
	 * Every entry currently in the queue, including the one holding the head lock.
	 */
	readonly #entries: AsyncQueueEntry[] = [];

	/**
	 * How many entries are in the queue, counting the one currently holding the lock.
	 *
	 * @see {@link AsyncQueue.queued} for the count that excludes it.
	 */
	public get remaining(): number {
		return this.#entries.length;
	}

	/**
	 * How many entries are waiting behind the one currently holding the lock.
	 *
	 * @see {@link AsyncQueue.remaining} for the count that includes it.
	 */
	public get queued(): number {
		return this.remaining === 0 ? 0 : this.remaining - 1;
	}

	/**
	 * Takes a place in the queue, resolving once every earlier caller has released theirs. Always
	 * pair this with {@link AsyncQueue.shift} in a `finally` block, otherwise the queue stalls.
	 *
	 * @param options Optionally carries an {@link AbortSignal} that removes this caller from the
	 * queue and rejects its promise.
	 *
	 * @example
	 * ```typescript
	 * const queue = new AsyncQueue();
	 *
	 * async function request(url: string, options: RequestInit) {
	 *   await queue.wait({ signal: options.signal });
	 *
	 *   try {
	 *     return await fetch(url, options);
	 *   } finally {
	 *     queue.shift();
	 *   }
	 * }
	 *
	 * request(firstUrl, firstOptions); // Runs immediately.
	 * request(secondUrl, secondOptions); // Runs once the first settles.
	 * request(thirdUrl, thirdOptions); // Runs once the second settles.
	 * ```
	 */
	public wait(options?: Readonly<AsyncQueueWaitOptions>): Promise<void> {
		const entry = new AsyncQueueEntry(this);

		if (this.#entries.length === 0) {
			this.#entries.push(entry);
			return Promise.resolve();
		}

		this.#entries.push(entry);
		if (options?.signal) entry.attachSignal(options.signal);
		return entry.promise;
	}

	/**
	 * Releases the head lock and hands it to the next caller in line, if there is one.
	 */
	public shift(): void {
		if (this.#entries.length === 0) return;

		if (this.#entries.length === 1) {
			this.#entries.shift();
			return;
		}

		// Drop the finished head so the next entry becomes the head, then unblock it.
		this.#entries.shift();
		this.#entries[0]!.release();
	}

	/**
	 * Rejects every waiting caller.
	 *
	 * The head lock is deliberately left alone — aborting it would let a second caller start while
	 * the first is still running.
	 */
	public abortAll(): void {
		if (this.queued === 0) return;

		// Start at 1 so the entry holding the head lock is left untouched.
		for (let index = 1; index < this.#entries.length; ++index) {
			this.#entries[index]!.abort();
		}

		this.#entries.length = 1;
	}

	/**
	 * Drops an entry from the queue without resolving or rejecting it.
	 *
	 * @internal Used by {@link AsyncQueueEntry} when its abort signal fires.
	 */
	public remove(entry: AsyncQueueEntry): void {
		const index = this.#entries.indexOf(entry);
		if (index !== -1) this.#entries.splice(index, 1);
	}
}
