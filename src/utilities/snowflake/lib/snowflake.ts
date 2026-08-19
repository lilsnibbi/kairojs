import type { DeconstructedSnowflake, SnowflakeGenerateOptions } from "@types";

/**
 * The maximum value the `workerId` field accepts in a snowflake.
 *
 * @since 1.0.0
 */
export const MaximumWorkerId = 0b11111n;

/**
 * The maximum value the `processId` field accepts in a snowflake.
 *
 * @since 1.0.0
 */
export const MaximumProcessId = 0b11111n;

/**
 * The maximum value the `increment` field accepts in a snowflake.
 *
 * @since 1.0.0
 */
export const MaximumIncrement = 0b111111111111n;

/**
 * The divisor used to recover a Unix timestamp from the leading bits of a snowflake.
 */
const TimestampFieldDivisor = 2 ** 22;

/**
 * Generates and deconstructs snowflakes: 64-bit unsigned integers built out of four fields laid
 * out against a fixed epoch.
 *
 * Given the snowflake `266241948824764416`, its bits break down as:
 * ```
 * 64                                          22     17     12          0
 *  000000111011000111100001101001000101000000  00001  00000  000000000000
 *           milliseconds since epoch           worker   pid     increment
 * ```
 *
 * @see {@link https://developer.twitter.com/en/docs/twitter-ids} for the format this class implements.
 *
 * @since 1.0.0
 */
export class Snowflake {
	/**
	 * Alias for {@link Snowflake.deconstruct}.
	 */
	public readonly decode = this.deconstruct;

	/**
	 * The epoch this instance generates and deconstructs snowflakes against, as a bigint.
	 */
	readonly #epoch: bigint;

	/**
	 * The epoch this instance generates and deconstructs snowflakes against, as a number.
	 */
	readonly #epochNumber: number;

	/**
	 * The internal counter used to fill the `increment` field when {@link Snowflake.generate} is
	 * called without one.
	 */
	#increment = 0n;

	/**
	 * The process ID used by default in {@link Snowflake.generate}.
	 */
	#processId = 1n;

	/**
	 * The worker ID used by default in {@link Snowflake.generate}.
	 */
	#workerId = 0n;

	/**
	 * @param epoch The epoch to generate and deconstruct snowflakes against.
	 */
	public constructor(epoch: number | bigint | Date) {
		this.#epoch = BigInt(epoch instanceof Date ? epoch.getTime() : epoch);
		this.#epochNumber = Number(this.#epoch);
	}

	/**
	 * The epoch this instance was constructed with, as a bigint.
	 */
	public get epoch(): bigint {
		return this.#epoch;
	}

	/**
	 * The epoch this instance was constructed with, as a number.
	 */
	public get epochNumber(): number {
		return this.#epochNumber;
	}

	/**
	 * The process ID used by default when generating snowflakes.
	 */
	public get processId(): bigint {
		return this.#processId;
	}

	/**
	 * Sets the process ID used by default when generating snowflakes.
	 *
	 * @param value The new value. It is coerced to a bigint and masked with {@link MaximumProcessId}.
	 */
	public set processId(value: number | bigint) {
		this.#processId = BigInt(value) & MaximumProcessId;
	}

	/**
	 * The worker ID used by default when generating snowflakes.
	 */
	public get workerId(): bigint {
		return this.#workerId;
	}

	/**
	 * Sets the worker ID used by default when generating snowflakes.
	 *
	 * @param value The new value. It is coerced to a bigint and masked with {@link MaximumWorkerId}.
	 */
	public set workerId(value: number | bigint) {
		this.#workerId = BigInt(value) & MaximumWorkerId;
	}

	/**
	 * Generates a new snowflake against this instance's epoch.
	 *
	 * When `increment` is omitted, the instance's internal counter is used and then advanced.
	 *
	 * @param options The fields to embed in the generated snowflake.
	 * @returns A unique snowflake.
	 *
	 * @example
	 * ```typescript
	 * const epoch = new Date("2000-01-01T00:00:00.000Z");
	 * const snowflake = new Snowflake(epoch).generate();
	 * ```
	 */
	public generate({
		increment,
		timestamp = Date.now(),
		workerId = this.#workerId,
		processId = this.#processId,
	}: SnowflakeGenerateOptions = {}) {
		let resolvedTimestamp: bigint;
		if (timestamp instanceof Date)
			resolvedTimestamp = BigInt(timestamp.getTime());
		else if (typeof timestamp === "number")
			resolvedTimestamp = BigInt(timestamp);
		else if (typeof timestamp === "bigint") resolvedTimestamp = timestamp;
		else
			throw new TypeError(
				`"timestamp" argument must be a number, bigint, or Date (received ${typeof timestamp})`,
			);

		let resolvedIncrement: bigint;
		if (typeof increment === "bigint") {
			resolvedIncrement = increment;
		} else {
			resolvedIncrement = this.#increment;
			this.#increment = (resolvedIncrement + 1n) & MaximumIncrement;
		}

		// timestamp, workerId, processId, increment
		return (
			((resolvedTimestamp - this.#epoch) << 22n) |
			((workerId & MaximumWorkerId) << 17n) |
			((processId & MaximumProcessId) << 12n) |
			(resolvedIncrement & MaximumIncrement)
		);
	}

	/**
	 * Deconstructs a snowflake into its individual fields.
	 *
	 * @param id The snowflake to deconstruct.
	 * @returns The fields embedded in `id`.
	 *
	 * @example
	 * ```typescript
	 * const epoch = new Date("2000-01-01T00:00:00.000Z");
	 * const snowflake = new Snowflake(epoch).deconstruct("3971046231244935168");
	 * ```
	 */
	public deconstruct(id: string | bigint): DeconstructedSnowflake {
		const bigIntId = BigInt(id);
		const epoch = this.#epoch;
		return {
			id: bigIntId,
			timestamp: (bigIntId >> 22n) + epoch,
			workerId: (bigIntId >> 17n) & MaximumWorkerId,
			processId: (bigIntId >> 12n) & MaximumProcessId,
			increment: bigIntId & MaximumIncrement,
			epoch,
		};
	}

	/**
	 * Retrieves the Unix timestamp, in milliseconds, embedded in a snowflake.
	 *
	 * @param id The snowflake to read the timestamp from.
	 * @returns The Unix timestamp stored in `id`.
	 */
	public timestampFrom(id: string | bigint): number {
		return Math.floor(Number(id) / TimestampFieldDivisor) + this.#epochNumber;
	}

	/**
	 * Compares two snowflakes for sort order.
	 *
	 * @param a The first snowflake to compare.
	 * @param b The second snowflake to compare.
	 * @returns `-1` if `a` is older than `b`, `0` if they are equal, `1` if `a` is newer than `b`.
	 *
	 * @example Sort snowflakes in ascending order
	 * ```typescript
	 * const ids = ["737141877803057244", "1056191128120082432", "254360814063058944"];
	 * console.log(ids.sort((a, b) => Snowflake.compare(a, b)));
	 * // → ["254360814063058944", "737141877803057244", "1056191128120082432"]
	 * ```
	 *
	 * @example Sort snowflakes in descending order
	 * ```typescript
	 * const ids = ["737141877803057244", "1056191128120082432", "254360814063058944"];
	 * console.log(ids.sort((a, b) => -Snowflake.compare(a, b)));
	 * // → ["1056191128120082432", "737141877803057244", "254360814063058944"]
	 * ```
	 */
	public static compare(a: string | bigint, b: string | bigint): -1 | 0 | 1 {
		const typeA = typeof a;
		if (typeA === typeof b) {
			return typeA === "string"
				? compareStrings(a as string, b as string)
				: compareBigInts(a as bigint, b as bigint);
		}
		return compareBigInts(BigInt(a), BigInt(b));
	}
}

/**
 * Compares two bigints for sort order.
 */
function compareBigInts(a: bigint, b: bigint): -1 | 0 | 1 {
	return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Compares two numeric strings for sort order, by length first and lexicographically second — this
 * only produces correct results for strings of digits, which is what snowflakes are.
 */
function compareStrings(a: string, b: string): -1 | 0 | 1 {
	return a === b
		? 0
		: a.length < b.length
			? -1
			: a.length > b.length
				? 1
				: a < b
					? -1
					: 1;
}
