import type {
	LoggerStyleBackground as LoggerStyleBackgroundConstant,
	LoggerStyleEffect as LoggerStyleEffectConstant,
	LoggerStyleText as LoggerStyleTextConstant,
} from "@/logger/colors.ts";
import type { LogLevel as LogLevelConstant } from "@/logger/log-level.ts";

/**
 * How severe a log entry is, derived from the frozen constant so the two can never drift apart.
 *
 * @since 1.0.0
 */
export type LogLevel = (typeof LogLevelConstant)[keyof typeof LogLevelConstant];

/**
 * The console methods a severity may be written through.
 *
 * @since 1.0.0
 */
export type LogMethods = "trace" | "debug" | "info" | "warn" | "error";

/**
 * What Kairo needs from a logger.
 *
 * Implement this to route the framework's output somewhere other than the console — a file, a
 * structured log service, a test spy — and hand the instance to the client through
 * {@link ClientLoggerOptions.instance}.
 *
 * @example
 * ```typescript
 * import { LogLevel, type Logger } from "kairojs";
 *
 * class SilentLogger implements Logger {
 *   public has(level: LogLevel) {
 *     return level >= LogLevel.Error;
 *   }
 *
 *   // ...the remaining members
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface Logger {
	/**
	 * Whether entries of the given severity are written rather than discarded.
	 *
	 * @param level The severity to test.
	 */
	has(level: LogLevel): boolean;

	/**
	 * Writes at {@link LogLevel.Trace}.
	 *
	 * @param values The values to write.
	 */
	trace(...values: readonly unknown[]): void;

	/**
	 * Writes at {@link LogLevel.Debug}.
	 *
	 * @param values The values to write.
	 */
	debug(...values: readonly unknown[]): void;

	/**
	 * Writes at {@link LogLevel.Info}.
	 *
	 * @param values The values to write.
	 */
	info(...values: readonly unknown[]): void;

	/**
	 * Writes at {@link LogLevel.Warn}.
	 *
	 * @param values The values to write.
	 */
	warn(...values: readonly unknown[]): void;

	/**
	 * Writes at {@link LogLevel.Error}.
	 *
	 * @param values The values to write.
	 */
	error(...values: readonly unknown[]): void;

	/**
	 * Writes at {@link LogLevel.Fatal}.
	 *
	 * @param values The values to write.
	 */
	fatal(...values: readonly unknown[]): void;

	/**
	 * Writes one entry at the given severity.
	 *
	 * @param level The severity to write at.
	 * @param values The values to write.
	 */
	write(level: LogLevel, ...values: readonly unknown[]): void;
}

/**
 * A function that wraps a value in ANSI escape sequences, or returns it unchanged when the output
 * stream cannot render them.
 *
 * @since 1.0.0
 */
export type Color = (input: string | number) => string;

/**
 * The text effects a logger style may combine, derived from the frozen constant.
 *
 * @since 1.0.0
 */
export type LoggerStyleEffect =
	(typeof LoggerStyleEffectConstant)[keyof typeof LoggerStyleEffectConstant];

/**
 * The foreground colours a logger style may use, derived from the frozen constant.
 *
 * @since 1.0.0
 */
export type LoggerStyleText =
	(typeof LoggerStyleTextConstant)[keyof typeof LoggerStyleTextConstant];

/**
 * The background colours a logger style may use, derived from the frozen constant.
 *
 * @since 1.0.0
 */
export type LoggerStyleBackground =
	(typeof LoggerStyleBackgroundConstant)[keyof typeof LoggerStyleBackgroundConstant];

/**
 * A style described by the pieces it is built from rather than by a ready-made function.
 *
 * @since 1.0.0
 */
export interface LoggerStyleOptions {
	/**
	 * The text effects to apply, such as `"italic"` or `"strikethrough"`.
	 */
	effects?: LoggerStyleEffect[];

	/**
	 * The foreground colour, such as `"red"` or `"yellow"`.
	 */
	text?: LoggerStyleText;

	/**
	 * The background colour, such as `"bgMagenta"` or `"bgRed"`.
	 */
	background?: LoggerStyleBackground;
}

/**
 * Anything a logger style can be built from: a styling function, or the pieces to combine into one.
 *
 * @since 1.0.0
 */
export type LoggerStyleResolvable = Color | LoggerStyleOptions;

/**
 * Turns the styled time into the prefix that precedes the message. It runs after the colour has been
 * applied, so it decides the separator rather than the appearance.
 *
 * @since 1.0.0
 */
export type LoggerTimestampFormatter = (timestamp: string) => string;

/**
 * How the time at the front of a log line is rendered.
 *
 * @since 1.0.0
 */
export interface LoggerTimestampOptions {
	/**
	 * The pattern the current date is rendered with.
	 *
	 * @default "YYYY-MM-DD HH:mm:ss"
	 * @example
	 * ```typescript
	 * "YYYY-MM-DD HH:mm:ss"
	 * // 2020-12-23 22:01:10
	 * ```
	 */
	pattern?: string;

	/**
	 * Whether the time is rendered in UTC rather than the machine's local zone.
	 *
	 * @default false
	 */
	utc?: boolean;

	/**
	 * The style applied to the rendered time, or `null` to leave it unstyled.
	 *
	 * @default the severity's own colour
	 */
	color?: LoggerStyleResolvable | null;

	/**
	 * The formatter producing the final prefix.
	 *
	 * @default (timestamp) => `${timestamp} - `
	 */
	formatter?: LoggerTimestampFormatter;
}

/**
 * The complete presentation of one severity.
 *
 * @since 1.0.0
 */
export interface LoggerLevelOptions {
	/**
	 * The timestamp options, or `null` to show no timestamp at all.
	 *
	 * @default {}
	 */
	timestamp?: LoggerTimestampOptions | null;

	/**
	 * The label placed between the timestamp and the message.
	 *
	 * @default ""
	 */
	infix?: string;

	/**
	 * The style applied to the message body, or `null` to leave it unstyled.
	 *
	 * @default no styling
	 */
	message?: LoggerStyleResolvable | null;
}

/**
 * The presentation of each severity. Anything left out is derived from
 * {@link LoggerOptions.defaultFormat} together with the severity's own colour and label.
 *
 * @since 1.0.0
 */
export interface LoggerFormatOptions {
	/**
	 * The presentation of {@link LogLevel.Trace}.
	 */
	trace?: LoggerLevelOptions;

	/**
	 * The presentation of {@link LogLevel.Debug}.
	 */
	debug?: LoggerLevelOptions;

	/**
	 * The presentation of {@link LogLevel.Info}.
	 */
	info?: LoggerLevelOptions;

	/**
	 * The presentation of {@link LogLevel.Warn}.
	 */
	warn?: LoggerLevelOptions;

	/**
	 * The presentation of {@link LogLevel.Error}.
	 */
	error?: LoggerLevelOptions;

	/**
	 * The presentation of {@link LogLevel.Fatal}.
	 */
	fatal?: LoggerLevelOptions;

	/**
	 * The presentation of uncategorised output, which doubles as the fallback for any severity
	 * without an entry of its own.
	 */
	none?: LoggerLevelOptions;
}

/**
 * The options the built-in logger is constructed with.
 *
 * @since 1.0.0
 */
export interface LoggerOptions {
	/**
	 * The base every unspecified entry of {@link LoggerOptions.format} is derived from.
	 *
	 * @default options.format.none ?? {}
	 */
	defaultFormat?: LoggerLevelOptions;

	/**
	 * The presentation of each severity.
	 *
	 * @default {}
	 */
	format?: LoggerFormatOptions;

	/**
	 * The lowest severity that is written; anything below it is discarded.
	 *
	 * @default LogLevel.Info
	 */
	level?: LogLevel;

	/**
	 * The separator placed between the values of a single call.
	 *
	 * @default " "
	 */
	join?: string;

	/**
	 * How deeply non-string values are inspected before being written.
	 *
	 * @default 0
	 */
	depth?: number;
}
