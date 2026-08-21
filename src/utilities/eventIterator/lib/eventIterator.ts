import type { EventIteratorFilter, EventIteratorOptions } from "@types";
import type { EventEmitter } from "node:events";

/**
 * Turns a stream of emitter events into an async iterable, so listening for a sequence of values —
 * a user's next few messages, a handful of button clicks — can be written as a `for await` loop
 * instead of a tangle of `on`/`off` calls.
 *
 * The iterator buffers values that arrive faster than they are consumed, and can end itself either
 * after a fixed number of accepted values or after a period of inactivity.
 *
 * @typeParam V The tuple of arguments the listened-to event emits.
 *
 * @example
 * ```typescript
 * const iterator = new EventIterator<[message: Message]>(client, "messageCreate", { idle: 30_000, limit: 5 });
 *
 * for await (const [message] of iterator) {
 *   console.log(`Received: ${message.content}`);
 * }
 * ```
 *
 * @since 1.0.0
 */
export class EventIterator<V extends unknown[]>
	implements AsyncIterableIterator<V>
{
	/**
	 * The emitter this iterator listens to.
	 */
	public readonly emitter: EventEmitter;

	/**
	 * The event name this iterator listens for.
	 */
	public readonly event: string;

	/**
	 * The predicate deciding which received values are actually yielded.
	 */
	public filter: EventIteratorFilter<V>;

	/**
	 * Whether this iterator has ended, either manually, by reaching its limit, or by idling out.
	 */
	#ended = false;

	/**
	 * How long, in milliseconds, this iterator may sit idle before ending itself.
	 */
	readonly #idle?: number;

	/**
	 * Values received from the emitter that have not been consumed yet.
	 */
	#queue: V[] = [];

	/**
	 * How many values have passed the filter so far.
	 */
	#passed = 0;

	/**
	 * How many values may pass the filter before this iterator ends itself.
	 */
	readonly #limit: number;

	/**
	 * The timer that ends this iterator once {@link EventIterator.#idle} elapses without a new value.
	 */
	readonly #idleTimer: ReturnType<typeof setTimeout> | undefined | null = null;

	/**
	 * The listener attached to {@link EventIterator.emitter}, bound once so it can be removed later.
	 */
	readonly #onValue: (this: EventIterator<V>, ...value: V) => void;

	/**
	 * @param emitter The emitter to listen to.
	 * @param event The event to receive values from.
	 * @param options Optional filtering, idle timeout and value limit.
	 */
	public constructor(
		emitter: EventEmitter,
		event: string,
		options: EventIteratorOptions<V> = {},
	) {
		this.emitter = emitter;
		this.event = event;
		this.#limit = options.limit ?? Infinity;
		this.#idle = options.idle;
		this.filter = options.filter ?? ((): boolean => true);

		// Ends the iterator if nothing arrives within the idle window.
		if (this.#idle)
			this.#idleTimer = setTimeout(this.end.bind(this), this.#idle);

		this.#onValue = this.push.bind(this);
		const maxListeners = this.emitter.getMaxListeners();
		if (maxListeners !== 0) this.emitter.setMaxListeners(maxListeners + 1);

		this.emitter.on(this.event, this.#onValue);
	}

	/**
	 * Whether this iterator has ended, either manually, by reaching its limit, or by idling out.
	 */
	public get ended(): boolean {
		return this.#ended;
	}

	/**
	 * Ends this iterator, detaching its listener from {@link EventIterator.emitter} and dropping any
	 * buffered values. Calling this more than once has no further effect.
	 */
	public end(): void {
		if (this.#ended) return;
		this.#ended = true;
		this.#queue = [];

		this.emitter.off(this.event, this.#onValue);
		const maxListeners = this.emitter.getMaxListeners();
		if (maxListeners !== 0) this.emitter.setMaxListeners(maxListeners - 1);
	}

	/**
	 * Resolves with the next value that passes {@link EventIterator.filter}, waiting for the emitter
	 * to produce one if none are buffered yet.
	 */
	public async next(): Promise<IteratorResult<V>> {
		// A buffered value is available — filter it before handing it back.
		if (this.#queue.length) {
			const value = this.#queue.shift()!;
			if (!this.filter(value)) return this.next();
			if (++this.#passed >= this.#limit) this.end();
			if (this.#idleTimer) this.#idleTimer.refresh();
			return { done: false, value };
		}

		// Nothing buffered and the iterator is done — report completion.
		if (this.#ended) {
			if (this.#idleTimer) clearTimeout(this.#idleTimer);
			return { done: true, value: undefined as never };
		}

		// Wait for the emitter to produce a new value.
		return new Promise<IteratorResult<V>>((resolve) => {
			let idleTimer: ReturnType<typeof setTimeout> | undefined | null = null;

			// A local idle timer ends the iterator if nothing arrives in time.
			if (this.#idle) {
				idleTimer = setTimeout(() => {
					this.end();
					resolve(this.next());
				}, this.#idle);
			}

			// Once a value arrives, clear the local timer and resolve through the normal path.
			this.emitter.once(this.event, () => {
				if (idleTimer) clearTimeout(idleTimer);
				resolve(this.next());
			});
		});
	}

	/**
	 * Ends the iterator in response to a `break` or `return` inside a `for await` loop.
	 */
	public return(): Promise<IteratorResult<V>> {
		this.end();
		return Promise.resolve({ done: true, value: undefined as never });
	}

	/**
	 * Ends the iterator in response to an error thrown inside a `for await` loop.
	 */
	public throw(): Promise<IteratorResult<V>> {
		this.end();
		return Promise.resolve({ done: true, value: undefined as never });
	}

	/**
	 * Returns this iterator itself, allowing it to be used directly in a `for await...of` loop.
	 */
	public [Symbol.asyncIterator](): AsyncIterableIterator<V> {
		return this;
	}

	/**
	 * Appends a value received from the emitter to the internal queue.
	 */
	protected push(...value: V): void {
		this.#queue.push(value);
	}
}
