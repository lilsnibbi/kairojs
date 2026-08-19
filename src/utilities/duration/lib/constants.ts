import type {
	DurationFormatAssetsTime,
	DurationFormatSeparators,
} from "@types";

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;
const month = day * (365 / 12);
const year = day * 365;

/**
 * The duration, in milliseconds, of one unit of time.
 *
 * @since 1.0.0
 */
export const Time = Object.freeze({
	Nanosecond: 1 / 1_000_000,
	Microsecond: 1 / 1000,
	Millisecond: 1,
	Second: second,
	Minute: minute,
	Hour: hour,
	Day: day,
	Week: week,
	// 29.53059 days is the astronomically accepted duration of a synodic month.
	Month: month,
	Year: year,
} as const);

/**
 * The names of the time units {@link Duration} and {@link DurationFormatter} understand.
 *
 * @since 1.0.0
 */
export const TimeTypes = Object.freeze({
	Second: "second",
	Minute: "minute",
	Hour: "hour",
	Day: "day",
	Week: "week",
	Month: "month",
	Year: "year",
} as const);

/**
 * The default English unit names {@link DurationFormatter} falls back to when no other assets are
 * given.
 *
 * @since 1.0.0
 */
export const DEFAULT_UNITS: DurationFormatAssetsTime = {
	[TimeTypes.Year]: {
		1: "year",
		DEFAULT: "years",
	},
	[TimeTypes.Month]: {
		1: "month",
		DEFAULT: "months",
	},
	[TimeTypes.Week]: {
		1: "week",
		DEFAULT: "weeks",
	},
	[TimeTypes.Day]: {
		1: "day",
		DEFAULT: "days",
	},
	[TimeTypes.Hour]: {
		1: "hour",
		DEFAULT: "hours",
	},
	[TimeTypes.Minute]: {
		1: "minute",
		DEFAULT: "minutes",
	},
	[TimeTypes.Second]: {
		1: "second",
		DEFAULT: "seconds",
	},
};

/**
 * The default separators {@link DurationFormatter#format} places around each rendered unit.
 *
 * @since 1.0.0
 */
export const DEFAULT_SEPARATORS: DurationFormatSeparators = {
	left: " ",
	right: " ",
	final: " ",
};
