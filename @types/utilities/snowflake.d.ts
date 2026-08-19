/**
 * Options accepted by `Snowflake#generate`.
 *
 * @since 1.0.0
 */
export interface SnowflakeGenerateOptions {
	/**
	 * The timestamp, as a number, bigint or {@link Date}, to embed in the generated snowflake.
	 *
	 * @default Date.now()
	 */
	timestamp?: number | bigint | Date;

	/**
	 * The increment to embed in the generated snowflake.
	 *
	 * Note that the instance's internal counter still auto-increments between calls to `generate`
	 * regardless of whether this option is used.
	 *
	 * @default 0n
	 */
	increment?: bigint;

	/**
	 * The worker ID to embed, truncated to 5 bits (0-31).
	 *
	 * @default 0n
	 */
	workerId?: bigint;

	/**
	 * The process ID to embed, truncated to 5 bits (0-31).
	 *
	 * @default 1n
	 */
	processId?: bigint;
}

/**
 * The fields extracted by `Snowflake#deconstruct`.
 *
 * @since 1.0.0
 */
export interface DeconstructedSnowflake {
	/**
	 * The snowflake, as a bigint.
	 */
	id: bigint;

	/**
	 * The timestamp stored in the snowflake, in milliseconds since the Unix epoch.
	 */
	timestamp: bigint;

	/**
	 * The worker ID stored in the snowflake.
	 */
	workerId: bigint;

	/**
	 * The process ID stored in the snowflake.
	 */
	processId: bigint;

	/**
	 * The increment stored in the snowflake.
	 */
	increment: bigint;

	/**
	 * The epoch, in milliseconds since the Unix epoch, the snowflake was deconstructed against.
	 */
	epoch: bigint;
}
