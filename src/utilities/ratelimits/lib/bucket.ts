import type { RateLimitManager } from "./manager.ts";

/**
 * A single rate-limit bucket: tracks how many uses are left for one key and when those uses reset.
 *
 * @since 1.0.0
 */
export class RateLimit<K = string> {
	/**
	 * How many more times this bucket can be consumed before it is limited.
	 */
	public remaining!: number;

	/**
	 * The timestamp, in milliseconds, at which this bucket becomes available again.
	 */
	public expires!: number;

	/**
	 * The manager that owns this bucket and supplies its limit and window.
	 */
	#manager: RateLimitManager<K>;

	/**
	 * @param manager The manager this bucket belongs to.
	 */
	public constructor(manager: RateLimitManager<K>) {
		this.#manager = manager;
		this.reset();
	}

	/**
	 * Whether this bucket's window has elapsed, meaning it may be reset.
	 */
	public get expired(): boolean {
		return this.remainingTime === 0;
	}

	/**
	 * Whether this bucket is currently out of uses and still inside its window.
	 */
	public get limited(): boolean {
		return this.remaining === 0 && !this.expired;
	}

	/**
	 * How many milliseconds remain before this bucket resets, or `0` once it has expired.
	 */
	public get remainingTime(): number {
		return Math.max(this.expires - Date.now(), 0);
	}

	/**
	 * Spends one use from this bucket, resetting it first if its window has already elapsed.
	 *
	 * @throws If the bucket is limited — check {@link RateLimit.limited} before calling.
	 */
	public consume(): this {
		if (this.limited) throw new Error("Cannot consume a limited bucket");
		if (this.expired) this.reset();

		this.remaining--;
		return this;
	}

	/**
	 * Restores this bucket to a full, freshly-windowed state.
	 */
	public reset(): this {
		return this.resetRemaining().resetTime();
	}

	/**
	 * Restores {@link RateLimit.remaining} to the manager's limit without touching the window.
	 */
	public resetRemaining(): this {
		this.remaining = this.#manager.limit;
		return this;
	}

	/**
	 * Starts a fresh window, pushing {@link RateLimit.expires} out by the manager's duration.
	 */
	public resetTime(): this {
		this.expires = Date.now() + this.#manager.time;
		return this;
	}
}
