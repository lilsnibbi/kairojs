import { Time } from "./constants.ts";

const tokens = new Map([
	["nanosecond", Time.Nanosecond],
	["nanoseconds", Time.Nanosecond],
	["ns", Time.Nanosecond],

	["microsecond", Time.Microsecond],
	["microseconds", Time.Microsecond],
	["μs", Time.Microsecond],
	["us", Time.Microsecond],

	["millisecond", Time.Millisecond],
	["milliseconds", Time.Millisecond],
	["ms", Time.Millisecond],

	["second", Time.Second],
	["seconds", Time.Second],
	["sec", Time.Second],
	["secs", Time.Second],
	["s", Time.Second],

	["minute", Time.Minute],
	["minutes", Time.Minute],
	["min", Time.Minute],
	["mins", Time.Minute],
	["m", Time.Minute],

	["hour", Time.Hour],
	["hours", Time.Hour],
	["hr", Time.Hour],
	["hrs", Time.Hour],
	["h", Time.Hour],

	["day", Time.Day],
	["days", Time.Day],
	["d", Time.Day],

	["week", Time.Week],
	["weeks", Time.Week],
	["wk", Time.Week],
	["wks", Time.Week],
	["w", Time.Week],

	["month", Time.Month],
	["months", Time.Month],
	["b", Time.Month],
	["mo", Time.Month],

	["year", Time.Year],
	["years", Time.Year],
	["yr", Time.Year],
	["yrs", Time.Year],
	["y", Time.Year],
]);

const mappings = new Map([
	[Time.Nanosecond, "nanoseconds"],
	[Time.Microsecond, "microseconds"],
	[Time.Millisecond, "milliseconds"],
	[Time.Second, "seconds"],
	[Time.Minute, "minutes"],
	[Time.Hour, "hours"],
	[Time.Day, "days"],
	[Time.Week, "weeks"],
	[Time.Month, "months"],
	[Time.Year, "years"],
] as const);

/**
 * Parses a free-form duration string, such as `"2 days"` or `"1h30m"`, into a millisecond offset
 * and exposes the amount of each unit that contributed to it.
 *
 * @since 1.0.0
 */
export class Duration {
	/**
	 * The parsed duration, in milliseconds. `NaN` when the pattern contained no recognisable units.
	 */
	public offset: number;

	/**
	 * The amount of nanoseconds extracted from the pattern.
	 */
	public nanoseconds = 0;

	/**
	 * The amount of microseconds extracted from the pattern.
	 */
	public microseconds = 0;

	/**
	 * The amount of milliseconds extracted from the pattern.
	 */
	public milliseconds = 0;

	/**
	 * The amount of seconds extracted from the pattern.
	 */
	public seconds = 0;

	/**
	 * The amount of minutes extracted from the pattern.
	 */
	public minutes = 0;

	/**
	 * The amount of hours extracted from the pattern.
	 */
	public hours = 0;

	/**
	 * The amount of days extracted from the pattern.
	 */
	public days = 0;

	/**
	 * The amount of weeks extracted from the pattern.
	 */
	public weeks = 0;

	/**
	 * The amount of months extracted from the pattern.
	 */
	public months = 0;

	/**
	 * The amount of years extracted from the pattern.
	 */
	public years = 0;

	/**
	 * The pattern used to extract each unit's amount from the source string.
	 */
	private static readonly patternRegex =
		/(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/gi;

	/**
	 * The pattern used to strip thousands-separator commas before parsing.
	 */
	private static readonly commaRegex = /,/g;

	/**
	 * The pattern used to normalise the articles `"a"` and `"an"` into `"1"`.
	 */
	private static readonly aAndAnRegex = /\ban?\b/gi;

	/**
	 * @param pattern The duration string to parse, e.g. `"2 days"`, `"1h30m"`, or `"a week"`.
	 */
	public constructor(pattern: string) {
		let result = 0;
		let valid = false;

		pattern
			.toLowerCase()
			.replace(Duration.commaRegex, "")
			.replace(Duration.aAndAnRegex, "1")
			.replace(Duration.patternRegex, (_, amount: string, unit: string) => {
				const token = tokens.get(unit);
				if (token !== undefined) {
					const parsedAmount = Number(amount);
					result += parsedAmount * token;
					this[mappings.get(token)!] += parsedAmount;
					valid = true;
				}
				return "";
			});

		this.offset = valid ? result : NaN;
	}

	/**
	 * The date obtained by adding {@link Duration.offset} to the current time.
	 */
	public get fromNow(): Date {
		return this.dateFrom(new Date());
	}

	/**
	 * Adds {@link Duration.offset} to the given date.
	 *
	 * @param date The date to offset.
	 */
	public dateFrom(date: Date): Date {
		return new Date(date.getTime() + this.offset);
	}
}
