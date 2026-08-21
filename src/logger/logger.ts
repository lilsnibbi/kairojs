import type {
	Color,
	LogLevel as Level,
	Logger as LoggerContract,
	LoggerFormatOptions,
	LoggerLevelOptions,
	LoggerOptions,
	LoggerStyleResolvable,
	LoggerTimestampFormatter,
	LoggerTimestampOptions,
	LogMethods,
} from "@types";
import { Timestamp } from "@utilities/timestamp/index.ts";
import { colors } from "./colors.ts";
import { LogLevel } from "./logLevel.ts";

/**
 * Applies a single, pre-resolved ANSI style to whatever it is handed.
 *
 * A style is described either by a ready-made styling function or by an options object naming the
 * effects, foreground and background to combine. Resolving that description once, in the
 * constructor, means the cost is paid at start-up rather than on every log line.
 *
 * @since 1.0.0
 */
export class LoggerStyle {
	/**
	 * The resolved styling function every call to {@link LoggerStyle.run} goes through.
	 */
	public readonly style: Color;

	/**
	 * @param resolvable The style to apply, or an empty object for no styling at all.
	 */
	public constructor(resolvable: LoggerStyleResolvable = {}) {
		if (typeof resolvable === "function") {
			this.style = resolvable;
			return;
		}

		const layers: Color[] = [];
		if (resolvable.effects)
			layers.push(...resolvable.effects.map((effect) => colors[effect]));
		if (resolvable.text) layers.push(colors[resolvable.text]);
		if (resolvable.background) layers.push(colors[resolvable.background]);

		if (layers.length === 0) {
			this.style = colors.reset;
		} else if (layers.length === 1) {
			this.style = layers[0]!;
		} else {
			this.style = (input) =>
				layers.reduce<string>((output, layer) => layer(output), String(input));
		}
	}

	/**
	 * Wraps a value in this style.
	 *
	 * @param input The value to style.
	 */
	public run(input: string | number) {
		return this.style(input);
	}
}

/**
 * Renders the current time for the front of a log line.
 *
 * @since 1.0.0
 */
export class LoggerTimestamp {
	/**
	 * The pattern the current date is rendered with.
	 */
	public timestamp: Timestamp;

	/**
	 * Whether the time is rendered in UTC rather than the machine's local zone.
	 */
	public utc: boolean;

	/**
	 * The style applied to the rendered time, or `null` to leave it unstyled.
	 */
	public color: LoggerStyle | null;

	/**
	 * Turns the styled time into the final prefix, which is where the separator between the time and
	 * the message is decided.
	 */
	public formatter: LoggerTimestampFormatter;

	/**
	 * @param options How the time should be rendered.
	 */
	public constructor(options: LoggerTimestampOptions = {}) {
		this.timestamp = new Timestamp(options.pattern ?? "YYYY-MM-DD HH:mm:ss");
		this.utc = options.utc ?? false;
		this.color = options.color === null ? null : new LoggerStyle(options.color);
		this.formatter = options.formatter ?? ((timestamp) => `${timestamp} - `);
	}

	/**
	 * Renders the time as of right now.
	 */
	public run() {
		const now = new Date();
		const rendered = this.utc
			? this.timestamp.displayUTC(now)
			: this.timestamp.display(now);
		return this.formatter(this.color ? this.color.run(rendered) : rendered);
	}
}

/**
 * The complete presentation of one log level: its timestamp, its label and the style of the message
 * body.
 *
 * Multi-line messages are handled deliberately — when there is a prefix, every line gets it, so a
 * stack trace stays aligned under its timestamp instead of dangling with the first line only.
 *
 * @since 1.0.0
 */
export class LoggerLevel {
	/**
	 * The timestamp renderer, or `null` when this level shows no timestamp.
	 */
	public timestamp: LoggerTimestamp | null;

	/**
	 * The label placed between the timestamp and the message, such as `"INFO  - "`.
	 */
	public infix: string;

	/**
	 * The style applied to the message body, or `null` to leave it unstyled.
	 */
	public message: LoggerStyle | null;

	/**
	 * @param options How this level should be presented.
	 */
	public constructor(options: LoggerLevelOptions = {}) {
		this.timestamp =
			options.timestamp === null
				? null
				: new LoggerTimestamp(options.timestamp);
		this.infix = options.infix ?? "";
		this.message =
			options.message === null ? null : new LoggerStyle(options.message);
	}

	/**
	 * Applies this level's presentation to an already-joined message.
	 *
	 * @param content The message body.
	 */
	public run(content: string) {
		const prefix = (this.timestamp?.run() ?? "") + this.infix;

		if (prefix.length) {
			const format = this.message //
				? (line: string) => prefix + this.message!.run(line)
				: (line: string) => prefix + line;
			return content.split("\n").map(format).join("\n");
		}

		return this.message ? this.message.run(content) : content;
	}
}

/**
 * The logger Kairo uses by default.
 *
 * Every entry is filtered against {@link Logger.level}, joined into a single string, then handed to
 * the {@link LoggerLevel} registered for its severity, which adds the timestamp, the level label and
 * the colours. Output goes to the global console, so anything that captures the process' standard
 * streams captures the bot's logs too.
 *
 * @example
 * ```typescript
 * import { KairoClient } from "kairojs";
 * import { Logger, LogLevel } from "kairojs/logger";
 *
 * const client = new KairoClient({
 *   intents: [],
 *   logger: { instance: new Logger({ level: LogLevel.Debug, depth: 2 }) }
 * });
 * ```
 *
 * @since 1.0.0
 */
export class Logger implements LoggerContract {
	/**
	 * The lowest severity that is written; anything below it is discarded.
	 */
	public level: Level;

	/**
	 * The presentation of each severity, including {@link LogLevel.None} which doubles as the
	 * fallback for any level without an entry of its own.
	 */
	public readonly formats: Map<Level, LoggerLevel>;

	/**
	 * The separator placed between the values of a single call.
	 */
	public readonly join: string;

	/**
	 * How deeply non-string values are inspected before being written.
	 */
	public readonly depth: number;

	/**
	 * @param options The logger's options, or just the minimum level to write.
	 */
	public constructor(options: LoggerOptions | Level = {}) {
		const resolved: LoggerOptions =
			typeof options === "number" ? { level: options } : options;

		this.level = resolved.level ?? LogLevel.Info;
		this.formats = Logger.createFormatMap(
			resolved.format,
			resolved.defaultFormat,
		);
		this.join = resolved.join ?? " ";
		this.depth = resolved.depth ?? 0;
	}

	/**
	 * Whether entries of the given severity are written rather than discarded.
	 *
	 * @param level The severity to test.
	 */
	public has(level: Level): boolean {
		return level >= this.level;
	}

	/**
	 * Writes at {@link LogLevel.Trace}.
	 *
	 * @param values The values to write.
	 */
	public trace(...values: readonly unknown[]): void {
		this.write(LogLevel.Trace, ...values);
	}

	/**
	 * Writes at {@link LogLevel.Debug}.
	 *
	 * @param values The values to write.
	 */
	public debug(...values: readonly unknown[]): void {
		this.write(LogLevel.Debug, ...values);
	}

	/**
	 * Writes at {@link LogLevel.Info}.
	 *
	 * @param values The values to write.
	 */
	public info(...values: readonly unknown[]): void {
		this.write(LogLevel.Info, ...values);
	}

	/**
	 * Writes at {@link LogLevel.Warn}.
	 *
	 * @param values The values to write.
	 */
	public warn(...values: readonly unknown[]): void {
		this.write(LogLevel.Warn, ...values);
	}

	/**
	 * Writes at {@link LogLevel.Error}.
	 *
	 * @param values The values to write.
	 */
	public error(...values: readonly unknown[]): void {
		this.write(LogLevel.Error, ...values);
	}

	/**
	 * Writes at {@link LogLevel.Fatal}.
	 *
	 * @param values The values to write.
	 */
	public fatal(...values: readonly unknown[]): void {
		this.write(LogLevel.Fatal, ...values);
	}

	/**
	 * Writes one entry at the given severity, dropping it when the severity is below
	 * {@link Logger.level}.
	 *
	 * @param level The severity to write at.
	 * @param values The values to write.
	 */
	public write(level: Level, ...values: readonly unknown[]): void {
		if (!this.has(level)) return;

		const method = Logger.methods.get(level) ?? "log";
		const format = this.formats.get(level) ?? this.formats.get(LogLevel.None)!;

		console[method](format.run(this.preprocess(values)));
	}

	/**
	 * Turns the values of one call into the single string the formatter receives.
	 *
	 * Strings are passed through untouched so pre-formatted messages survive intact; everything else
	 * is inspected at {@link Logger.depth}.
	 *
	 * @param values The values to join.
	 */
	protected preprocess(values: readonly unknown[]) {
		const options = { colors: Bun.enableANSIColors, depth: this.depth };
		return values
			.map((value) =>
				typeof value === "string" ? value : Bun.inspect(value, options),
			)
			.join(this.join);
	}

	/**
	 * Whether the current output stream can render colours. When it cannot, every style this logger
	 * applies is a passthrough.
	 */
	public static get stylize() {
		return Bun.enableANSIColors;
	}

	/**
	 * The console method each severity is written through, chosen so the runtime routes warnings and
	 * errors to standard error.
	 */
	protected static readonly methods: ReadonlyMap<Level, LogMethods> = new Map([
		[LogLevel.Trace, "trace"],
		[LogLevel.Debug, "debug"],
		[LogLevel.Info, "info"],
		[LogLevel.Warn, "warn"],
		[LogLevel.Error, "error"],
		[LogLevel.Fatal, "error"],
	]);

	/**
	 * Builds the presentation for every severity, filling any the caller left out.
	 *
	 * @param options The per-level overrides.
	 * @param defaults The base every unspecified level is built from.
	 */
	private static createFormatMap(
		options: LoggerFormatOptions = {},
		defaults: LoggerLevelOptions = options.none ?? {},
	) {
		return new Map<Level, LoggerLevel>([
			[
				LogLevel.Trace,
				Logger.resolveLevel(options.trace, defaults, colors.gray, "TRACE"),
			],
			[
				LogLevel.Debug,
				Logger.resolveLevel(options.debug, defaults, colors.magenta, "DEBUG"),
			],
			[
				LogLevel.Info,
				Logger.resolveLevel(options.info, defaults, colors.cyan, "INFO"),
			],
			[
				LogLevel.Warn,
				Logger.resolveLevel(options.warn, defaults, colors.yellow, "WARN"),
			],
			[
				LogLevel.Error,
				Logger.resolveLevel(options.error, defaults, colors.red, "ERROR"),
			],
			[
				LogLevel.Fatal,
				Logger.resolveLevel(options.fatal, defaults, colors.bgRed, "FATAL"),
			],
			[
				LogLevel.None,
				Logger.resolveLevel(options.none, defaults, colors.white, ""),
			],
		]);
	}

	/**
	 * Resolves one severity's presentation, honouring an explicit override or otherwise deriving it
	 * from the defaults and the level's own colour and label.
	 *
	 * @param options The caller's override for this severity, if any.
	 * @param defaults The base to derive from.
	 * @param color The colour this severity is identified by.
	 * @param name The label to pad and place before the message, or an empty string for none.
	 */
	private static resolveLevel(
		options: LoggerLevelOptions | undefined,
		defaults: LoggerLevelOptions,
		color: Color,
		name: string,
	) {
		if (options) return new LoggerLevel(options);

		return new LoggerLevel({
			...defaults,
			timestamp:
				defaults.timestamp === null
					? null
					: { ...(defaults.timestamp ?? {}), color },
			infix: name.length ? `${color(name.padEnd(5, " "))} - ` : "",
		});
	}
}
