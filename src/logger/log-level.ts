/**
 * How severe a log entry is.
 *
 * The values are ordered numerically so a logger can decide whether to emit an entry with a single
 * comparison: anything below the logger's own level is dropped. The gaps between the numbers are
 * deliberate — they leave room for custom levels to sit between the built-in ones.
 *
 * @since 1.0.0
 */
export const LogLevel = Object.freeze({
	/**
	 * The most detailed level, reserved for the loader's step-by-step reporting.
	 */
	Trace: 10,

	/**
	 * Detail useful while developing, but noise in production.
	 */
	Debug: 20,

	/**
	 * Ordinary progress reporting.
	 */
	Info: 30,

	/**
	 * Something recoverable happened that the developer should know about.
	 */
	Warn: 40,

	/**
	 * Something failed.
	 */
	Error: 50,

	/**
	 * Something failed badly enough that the process is unlikely to keep working.
	 */
	Fatal: 60,

	/**
	 * Uncategorised output. Sitting above every other level, it is never filtered out and is used as
	 * the fallback style when a level has no formatting of its own.
	 */
	None: 100,
} as const);
