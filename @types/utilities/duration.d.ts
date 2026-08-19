/**
 * The duration, in milliseconds, of one unit of time — derived from the frozen `Time` object.
 *
 * @since 1.0.0
 */
export type Time =
	typeof import("@/utilities/duration/lib/constants.ts").Time[keyof typeof import("@/utilities/duration/lib/constants.ts").Time];

/**
 * The names of the time units {@link Duration} and {@link DurationFormatter} understand — derived
 * from the frozen `TimeTypes` object.
 *
 * @since 1.0.0
 */
export type TimeTypes =
	typeof import("@/utilities/duration/lib/constants.ts").TimeTypes[keyof typeof import("@/utilities/duration/lib/constants.ts").TimeTypes];

/**
 * The separators `DurationFormatter#format` places around each rendered unit.
 *
 * @since 1.0.0
 */
export interface DurationFormatSeparators {
	/**
	 * Placed between a unit's number and its name, e.g. the space in `"3 days"`.
	 */
	left?: string;

	/**
	 * Placed between two non-final units, e.g. the `", "` in `"3 days, 2 hours"`.
	 */
	right?: string;

	/**
	 * Placed before the final unit when there is more than one, e.g. the `" and "` in
	 * `"3 days and 2 hours"`.
	 */
	final?: string;
}

/**
 * The singular and plural names for one time unit at every precision {@link DurationFormatter} may
 * need, keyed by the exact rendered count. `DEFAULT` is used for any count without its own entry.
 *
 * @since 1.0.0
 */
export interface DurationFormatAssetsUnit extends Record<number, string> {
	DEFAULT: string;
}

/**
 * The complete set of unit names {@link DurationFormatter} draws from, one {@link DurationFormatAssetsUnit}
 * per {@link TimeTypes}.
 *
 * @since 1.0.0
 */
export type DurationFormatAssetsTime = Record<
	TimeTypes,
	DurationFormatAssetsUnit
>;
