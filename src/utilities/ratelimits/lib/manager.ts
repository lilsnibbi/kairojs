import { RateLimit } from "./bucket.ts";

/**
 * Holds one {@link RateLimit} bucket per key — a user, a channel, a guild — and periodically sweeps
 * away the buckets whose windows have elapsed.
 *
 * @since 1.0.0
 */
export class RateLimitManager<K = string> extends Map<K, RateLimit<K>> {
	/**
	 * How long each bucket's window lasts, in milliseconds.
	 */
	public readonly time: number;

	/**
	 * How many times a bucket may be consumed before it becomes limited.
	 */
	public readonly limit: number;

	/**
	 * The interval sweeping expired buckets, or `null` while there is nothing to sweep.
	 */
	#sweeper: ReturnType<typeof setInterval> | null = null;

	/**
	 * @param time How long each bucket's window lasts, in milliseconds.
	 * @param limit How many times a bucket may be consumed before it becomes limited.
	 */
	public constructor(time: number, limit = 1) {
		super();

		this.time = time;
		this.limit = limit;
	}

	/**
	 * Returns the bucket for the given key, creating it if it does not exist yet.
	 *
	 * @param id The key to look up.
	 */
	public acquire(id: K): RateLimit<K> {
		return this.get(id) ?? this.create(id);
	}

	/**
	 * Creates and stores a fresh bucket for the given key, replacing any existing one.
	 *
	 * @param id The key the bucket belongs to.
	 */
	public create(id: K): RateLimit<K> {
		const bucket = new RateLimit(this);
		this.set(id, bucket);
		return bucket;
	}

	/**
	 * Stores a bucket, starting the sweep interval if it is not already running.
	 *
	 * @param id The key the bucket belongs to.
	 * @param bucket The bucket to store.
	 */
	public override set(id: K, bucket: RateLimit<K>): this {
		if (this.#sweeper === null) {
			this.#sweeper = setInterval(
				this.sweep.bind(this),
				RateLimitManager.sweepInterval,
			);
			// Never keep the process alive purely to sweep rate limits.
			this.#sweeper.unref?.();
		}

		return super.set(id, bucket);
	}

	/**
	 * Removes every expired bucket, stopping the sweep interval once nothing is left to sweep.
	 */
	public sweep(): void {
		for (const [id, bucket] of this.entries()) {
			if (bucket.expired) this.delete(id);
		}

		if (this.size === 0 && this.#sweeper !== null) {
			clearInterval(this.#sweeper);
			this.#sweeper = null;
		}
	}

	/**
	 * How often, in milliseconds, expired buckets are swept away.
	 */
	public static sweepInterval = 30_000;
}
