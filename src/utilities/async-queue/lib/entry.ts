import type { AsyncQueue } from "./queue.ts";

/**
 * A single waiter in an {@link AsyncQueue}. Holds the promise handed back to the caller along with
 * the abort wiring that removes it from the queue if its signal fires.
 *
 * @internal
 * @since 1.0.0
 */
export class AsyncQueueEntry {
	/**
	 * Resolves once this entry reaches the head of the queue, or rejects if it is aborted.
	 */
	public readonly promise: Promise<void>;

	#resolve!: () => void;
	#reject!: (error: Error) => void;
	#queue: AsyncQueue;
	#signal: AbortSignal | null = null;
	#onAbort: (() => void) | null = null;

	public constructor(queue: AsyncQueue) {
		this.#queue = queue;
		this.promise = new Promise((resolve, reject) => {
			this.#resolve = resolve;
			this.#reject = reject;
		});
	}

	/**
	 * Attaches an abort signal that, when fired, drops this entry from its queue and rejects it.
	 *
	 * Signals that have already aborted are ignored, matching the behaviour of an entry that was
	 * never given a signal at all.
	 */
	public attachSignal(signal: AbortSignal): this {
		if (signal.aborted) return this;

		this.#signal = signal;
		this.#onAbort = () => {
			this.#queue.remove(this);
			this.#reject(new Error("Request aborted manually"));
		};

		this.#signal.addEventListener("abort", this.#onAbort);
		return this;
	}

	/**
	 * Unblocks the caller waiting on this entry.
	 */
	public release(): this {
		this.#detach();
		this.#resolve();
		return this;
	}

	/**
	 * Rejects the caller waiting on this entry.
	 */
	public abort(): this {
		this.#detach();
		this.#reject(new Error("Request aborted manually"));
		return this;
	}

	#detach(): void {
		if (this.#signal) {
			this.#signal.removeEventListener("abort", this.#onAbort!);
			this.#signal = null;
			this.#onAbort = null;
		}
	}
}
