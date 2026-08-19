/**
 * A high-resolution timer built on {@link performance.now}, used across Kairo to measure how long
 * command runs, piece loads and other framework operations take.
 *
 * @since 1.0.0
 */
export class Stopwatch {
	/**
	 * How many digits appear after the decimal point in {@link Stopwatch.toString}.
	 */
	public digits: number;

	/**
	 * The moment this stopwatch last started counting.
	 */
	#startedAt: number;

	/**
	 * The moment this stopwatch was stopped, or `null` while it is still running.
	 */
	#stoppedAt: number | null;

	/**
	 * Creates a stopwatch that starts counting immediately.
	 *
	 * @param digits How many digits to show after the decimal point when formatting.
	 */
	public constructor(digits = 2) {
		this.digits = digits;
		this.#startedAt = performance.now();
		this.#stoppedAt = null;
	}

	/**
	 * The elapsed time in milliseconds: measured up to now while running, or up to the moment it was
	 * stopped otherwise.
	 */
	public get duration(): number {
		return this.#stoppedAt
			? this.#stoppedAt - this.#startedAt
			: performance.now() - this.#startedAt;
	}

	/**
	 * Whether this stopwatch is currently counting.
	 */
	public get running(): boolean {
		return Boolean(!this.#stoppedAt);
	}

	/**
	 * Clears the elapsed time and leaves the stopwatch running.
	 */
	public restart(): this {
		this.#startedAt = performance.now();
		this.#stoppedAt = null;
		return this;
	}

	/**
	 * Clears the elapsed time and leaves the stopwatch stopped.
	 */
	public reset(): this {
		this.#startedAt = performance.now();
		this.#stoppedAt = this.#startedAt;
		return this;
	}

	/**
	 * Resumes counting, preserving any time already elapsed. Does nothing if already running.
	 */
	public start(): this {
		if (!this.running) {
			this.#startedAt = performance.now() - this.duration;
			this.#stoppedAt = null;
		}

		return this;
	}

	/**
	 * Stops counting, freezing {@link Stopwatch.duration}. Does nothing if already stopped.
	 */
	public stop(): this {
		if (this.running) this.#stoppedAt = performance.now();
		return this;
	}

	/**
	 * Formats the elapsed time with the most readable unit — seconds, milliseconds or microseconds.
	 */
	public toString(): string {
		const elapsed = this.duration;
		if (elapsed >= 1000) return `${(elapsed / 1000).toFixed(this.digits)}s`;
		if (elapsed >= 1) return `${elapsed.toFixed(this.digits)}ms`;
		return `${(elapsed * 1000).toFixed(this.digits)}μs`;
	}
}
