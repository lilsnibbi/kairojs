// Every package that measures time needs the same unit table. It is defined once, in the
// duration package, and re-exported here so the three cannot drift apart.
export { Time } from "@utilities/duration/lib/constants.ts";

/**
 * The full names of the days of the week, starting from Sunday, used by the `d`/`dd`/`ddd`/`dddd`
 * tokens.
 *
 * @since 1.0.0
 */
export const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

/**
 * The full names of the months of the year, starting from January, used by the `M`/`MMM`/`MMMM`
 * tokens.
 *
 * @since 1.0.0
 */
export const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/**
 * Every recognised pattern token mapped to the maximum number of times it may repeat, e.g. `Y` may
 * repeat up to 4 times (`YYYY`).
 *
 * @since 1.0.0
 */
export const tokens = new Map<string, number>([
	["Y", 4],
	["Q", 1],
	["M", 4],
	["D", 4],
	["d", 4],
	["X", 1],
	["x", 1],
	["H", 2],
	["h", 2],
	["a", 1],
	["A", 1],
	["m", 2],
	["s", 2],
	["S", 3],
	["Z", 2],
	["l", 4],
	["L", 4],
	["T", 1],
	["t", 1],
]);
