import type {
	TimeResolvable,
	TimestampTemplateEntry,
	TimestampTokenResolver,
} from "@types";
import { days, months, Time, tokens } from "./constants.ts";

const tokenResolvers = new Map<string, TimestampTokenResolver>([
	// Dates
	["Y", (time) => String(time.getFullYear()).slice(2)],
	["YY", (time) => String(time.getFullYear()).slice(2)],
	["YYY", (time) => String(time.getFullYear())],
	["YYYY", (time) => String(time.getFullYear())],
	["Q", (time) => String((time.getMonth() + 1) / 3)],
	["M", (time) => String(time.getMonth() + 1)],
	["MM", (time) => String(time.getMonth() + 1).padStart(2, "0")],
	["MMM", (time) => months[time.getMonth()]],
	["MMMM", (time) => months[time.getMonth()]],
	["D", (time) => String(time.getDate())],
	["DD", (time) => String(time.getDate()).padStart(2, "0")],
	[
		"DDD",
		(time) =>
			String(
				Math.floor(
					(time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) /
						Time.Day,
				),
			),
	],
	[
		"DDDD",
		(time) =>
			String(
				Math.floor(
					(time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) /
						Time.Day,
				),
			),
	],
	[
		"d",
		(time) => {
			const day = String(time.getDate());
			if (day !== "11" && day.endsWith("1")) return `${day}st`;
			if (day !== "12" && day.endsWith("2")) return `${day}nd`;
			if (day !== "13" && day.endsWith("3")) return `${day}rd`;
			return `${day}th`;
		},
	],
	["dd", (time) => days[time.getDay()].slice(0, 2)],
	["ddd", (time) => days[time.getDay()].slice(0, 3)],
	["dddd", (time) => days[time.getDay()]],
	["X", (time) => String(time.valueOf() / Time.Second)],
	["x", (time) => String(time.valueOf())],

	// Locale-flavoured times
	["H", (time) => String(time.getHours())],
	["HH", (time) => String(time.getHours()).padStart(2, "0")],
	["h", (time) => String(time.getHours() % 12 || 12)],
	["hh", (time) => String(time.getHours() % 12 || 12).padStart(2, "0")],
	["a", (time) => (time.getHours() < 12 ? "am" : "pm")],
	["A", (time) => (time.getHours() < 12 ? "AM" : "PM")],
	["m", (time) => String(time.getMinutes())],
	["mm", (time) => String(time.getMinutes()).padStart(2, "0")],
	["s", (time) => String(time.getSeconds())],
	["ss", (time) => String(time.getSeconds()).padStart(2, "0")],
	["S", (time) => String(time.getMilliseconds())],
	["SS", (time) => String(time.getMilliseconds()).padStart(2, "0")],
	["SSS", (time) => String(time.getMilliseconds()).padStart(3, "0")],
	[
		"T",
		(time) =>
			`${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, "0")} ${time.getHours() < 12 ? "AM" : "PM"}`,
	],
	[
		"t",
		(time) =>
			`${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, "0")}:${String(time.getSeconds()).padStart(2, "0")} ${
				time.getHours() < 12 ? "am" : "pm"
			}`,
	],
	[
		"L",
		(time) =>
			`${String(time.getMonth() + 1).padStart(2, "0")}/${String(time.getDate()).padStart(2, "0")}/${String(time.getFullYear())}`,
	],
	[
		"l",
		(time) =>
			`${String(time.getMonth() + 1)}/${String(time.getDate()).padStart(2, "0")}/${String(time.getFullYear())}`,
	],
	[
		"LL",
		(time) =>
			`${months[time.getMonth()]} ${String(time.getDate()).padStart(2, "0")}, ${String(time.getFullYear())}`,
	],
	[
		"ll",
		(time) =>
			`${months[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, "0")}, ${String(time.getFullYear())}`,
	],
	[
		"LLL",
		(time) =>
			`${months[time.getMonth()]} ${String(time.getDate()).padStart(2, "0")}, ${String(time.getFullYear())} ${String(
				time.getHours() % 12 || 12,
			)}:${String(time.getMinutes()).padStart(2, "0")} ${time.getHours() < 12 ? "AM" : "PM"}`,
	],
	[
		"lll",
		(time) =>
			`${months[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, "0")}, ${String(time.getFullYear())} ${String(
				time.getHours() % 12 || 12,
			)}:${String(time.getMinutes()).padStart(2, "0")} ${time.getHours() < 12 ? "AM" : "PM"}`,
	],
	[
		"LLLL",
		(time) =>
			`${days[time.getDay()]}, ${months[time.getMonth()]} ${String(time.getDate()).padStart(2, "0")}, ${String(time.getFullYear())} ${String(
				time.getHours() % 12 || 12,
			)}:${String(time.getMinutes()).padStart(2, "0")} ${time.getHours() < 12 ? "AM" : "PM"}`,
	],
	[
		"llll",
		(time) =>
			`${days[time.getDay()].slice(0, 3)} ${months[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, "0")}, ${String(
				time.getFullYear(),
			)} ${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, "0")} ${time.getHours() < 12 ? "AM" : "PM"}`,
	],
	[
		"Z",
		(time) => {
			const offset = time.getTimezoneOffset();
			const unsigned = offset >= 0;
			const absolute = Math.abs(offset);
			return `${unsigned ? "+" : "-"}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
		},
	],
	[
		"ZZ",
		(time) => {
			const offset = time.getTimezoneOffset();
			const unsigned = offset >= 0;
			const absolute = Math.abs(offset);
			return `${unsigned ? "+" : "-"}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
		},
	],
]);

/**
 * Parses a display pattern once and reuses it to render arbitrary dates or UNIX timestamps.
 *
 * @since 1.0.0
 */
export class Timestamp {
	/**
	 * The raw pattern this instance was constructed with.
	 */
	public pattern: string;

	/**
	 * The pattern, pre-split into literal chunks and tokens, so repeated {@link Timestamp.display}
	 * calls don't re-parse it.
	 */
	#template: TimestampTemplateEntry[];

	/**
	 * @param pattern The pattern to parse.
	 */
	public constructor(pattern: string) {
		this.pattern = pattern;
		this.#template = Timestamp.parse(pattern);
	}

	/**
	 * Renders a date or UNIX timestamp using this instance's pattern.
	 *
	 * @param time The date, timestamp, or date string to render.
	 */
	public display(time: TimeResolvable = new Date()): string {
		return Timestamp.display(this.#template, time);
	}

	/**
	 * Renders a date or UNIX timestamp, converted to UTC first, using this instance's pattern.
	 *
	 * @param time The date, timestamp, or date string to render.
	 */
	public displayUTC(time?: TimeResolvable): string {
		return Timestamp.display(this.#template, Timestamp.utc(time));
	}

	/**
	 * Replaces this instance's pattern, re-parsing it.
	 *
	 * @param pattern The new pattern to use.
	 */
	public edit(pattern: string): this {
		this.pattern = pattern;
		this.#template = Timestamp.parse(pattern);
		return this;
	}

	/**
	 * Renders the current date using this instance's pattern.
	 */
	public toString(): string {
		return this.display();
	}

	/**
	 * Parses `pattern` and immediately renders `time` with it, without keeping the parsed template
	 * around for reuse.
	 *
	 * @param pattern The pattern to parse.
	 * @param time The date, timestamp, or date string to render.
	 */
	public static displayArbitrary(
		pattern: string,
		time: TimeResolvable = new Date(),
	): string {
		return Timestamp.display(Timestamp.parse(pattern), time);
	}

	/**
	 * Parses `pattern` and immediately renders `time`, converted to UTC first, without keeping the
	 * parsed template around for reuse.
	 *
	 * @param pattern The pattern to parse.
	 * @param time The date, timestamp, or date string to render.
	 */
	public static displayUTCArbitrary(
		pattern: string,
		time: TimeResolvable = new Date(),
	): string {
		return Timestamp.display(Timestamp.parse(pattern), Timestamp.utc(time));
	}

	/**
	 * Converts a date to UTC by adding its own timezone offset.
	 *
	 * @param time The date, timestamp, or date string to convert.
	 */
	public static utc(time: TimeResolvable = new Date()): Date {
		const resolved = Timestamp.resolveDate(time);
		return new Date(resolved.valueOf() + resolved.getTimezoneOffset() * 60000);
	}

	/**
	 * Renders a parsed template against a date.
	 *
	 * @param template The parsed template to render.
	 * @param time The date, timestamp, or date string to render.
	 */
	private static display(
		template: TimestampTemplateEntry[],
		time: TimeResolvable,
	): string {
		let output = "";
		const parsedTime = Timestamp.resolveDate(time);
		for (const { content, type } of template)
			output += content || tokenResolvers.get(type)!(parsedTime);
		return output;
	}

	/**
	 * Splits a pattern into literal chunks and tokens.
	 *
	 * @param pattern The pattern to parse.
	 */
	private static parse(pattern: string): TimestampTemplateEntry[] {
		const template: TimestampTemplateEntry[] = [];
		for (let index = 0; index < pattern.length; index++) {
			let current = "";
			const currentChar = pattern[index];
			const tokenMax = tokens.get(currentChar);
			if (typeof tokenMax === "number") {
				current += currentChar;
				while (pattern[index + 1] === currentChar && current.length < tokenMax)
					current += pattern[++index];
				template.push({ type: current, content: null });
			} else if (currentChar === "[") {
				while (index + 1 < pattern.length && pattern[index + 1] !== "]")
					current += pattern[++index];
				index++;
				template.push({ type: "literal", content: current || "[" });
			} else {
				current += currentChar;
				while (
					index + 1 < pattern.length &&
					!tokens.has(pattern[index + 1]) &&
					pattern[index + 1] !== "["
				)
					current += pattern[++index];
				template.push({ type: "literal", content: current });
			}
		}

		return template;
	}

	/**
	 * Resolves any {@link TimeResolvable} into a concrete {@link Date}.
	 *
	 * @param time The value to resolve.
	 */
	private static resolveDate(time: TimeResolvable): Date {
		return time instanceof Date ? time : new Date(time);
	}
}
