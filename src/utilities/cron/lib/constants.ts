// Every package that measures time needs the same unit table. It is defined once, in the
// duration package, and re-exported here so the three cannot drift apart.
export { Time } from "@utilities/duration/lib/constants.ts";

/**
 * Matches a single cron field: a wildcard (`*`), or a number optionally followed by a `-max` range,
 * optionally followed by a `/step`.
 *
 * @since 1.0.0
 */
export const partRegex = /^(?:(\*)|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/;

/**
 * Matches the `h` and `?` "random value" wildcards inside a cron field.
 *
 * @since 1.0.0
 */
export const wildcardRegex = /\bh\b|\B\?\B/g;

/**
 * The inclusive `[min, max]` range allowed for each of the five cron fields, in order: minute,
 * hour, day of month, month, day of week.
 *
 * @since 1.0.0
 */
export const allowedNum = [
	[0, 59],
	[0, 23],
	[1, 31],
	[1, 12],
	[0, 6],
];

/**
 * The non-standard `@`-prefixed shorthands accepted in place of a full 5-field cron pattern.
 *
 * @since 1.0.0
 */
export const predefined = {
	"@annually": "0 0 1 1 *",
	"@yearly": "0 0 1 1 *",
	"@monthly": "0 0 1 * *",
	"@weekly": "0 0 * * 0",
	"@daily": "0 0 * * *",
	"@hourly": "0 * * * *",
} as const;

/**
 * The month and day-of-week name abbreviations accepted inside a cron pattern, mapped to their
 * numeric equivalents.
 *
 * @since 1.0.0
 */
export const cronTokens = {
	jan: 1,
	feb: 2,
	mar: 3,
	apr: 4,
	may: 5,
	jun: 6,
	jul: 7,
	aug: 8,
	sep: 9,
	oct: 10,
	nov: 11,
	dec: 12,
	sun: 0,
	mon: 1,
	tue: 2,
	wed: 3,
	thu: 4,
	fri: 5,
	sat: 6,
} as const;

/**
 * Matches any of {@link cronTokens}'s keys inside a normalised cron pattern.
 *
 * @since 1.0.0
 */
export const tokensRegex = new RegExp(Object.keys(cronTokens).join("|"), "g");
