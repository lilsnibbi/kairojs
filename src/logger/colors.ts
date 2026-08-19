import type { Color } from "@types";

/**
 * Builds a styling function for a pair of SGR (Select Graphic Rendition) codes.
 *
 * The returned function is a no-op passthrough whenever the runtime reports that the output stream
 * cannot render escape sequences — piping the bot's output into a file therefore yields plain text
 * with no extra work from the caller.
 *
 * Nested styles are handled the way every terminal-colour library handles them: any closing
 * sequence found inside the input is followed by a fresh opening sequence, so the outer style
 * resumes instead of being cut short by the inner one.
 *
 * @param open The code that turns the style on.
 * @param close The code that turns it off again.
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#SGR
 */
function createStyle(open: number, close: number): Color {
	const prefix = `\u001B[${open}m`;
	const suffix = `\u001B[${close}m`;

	return (input) => {
		const text = String(input);
		if (!Bun.enableANSIColors) return text;

		return (
			prefix +
			(text.includes(suffix)
				? text.replaceAll(suffix, suffix + prefix)
				: text) +
			suffix
		);
	};
}

/**
 * Every ANSI style the logger can apply, keyed by name.
 *
 * Each entry takes a string or a number and returns it wrapped in the matching escape sequences, or
 * unchanged when colours are unavailable. They compose freely: `colors.bold(colors.red("!"))`.
 *
 * @example
 * ```typescript
 * import { colors } from "kairojs/logger";
 *
 * console.log(colors.bgRed(colors.white("FATAL")));
 * ```
 *
 * @since 1.0.0
 */
export const colors = Object.freeze({
	reset: createStyle(0, 0),
	bold: createStyle(1, 22),
	dim: createStyle(2, 22),
	italic: createStyle(3, 23),
	underline: createStyle(4, 24),
	inverse: createStyle(7, 27),
	hidden: createStyle(8, 28),
	strikethrough: createStyle(9, 29),

	black: createStyle(30, 39),
	red: createStyle(31, 39),
	green: createStyle(32, 39),
	yellow: createStyle(33, 39),
	blue: createStyle(34, 39),
	magenta: createStyle(35, 39),
	cyan: createStyle(36, 39),
	white: createStyle(37, 39),
	gray: createStyle(90, 39),
	blackBright: createStyle(90, 39),
	redBright: createStyle(91, 39),
	greenBright: createStyle(92, 39),
	yellowBright: createStyle(93, 39),
	blueBright: createStyle(94, 39),
	magentaBright: createStyle(95, 39),
	cyanBright: createStyle(96, 39),
	whiteBright: createStyle(97, 39),

	bgBlack: createStyle(40, 49),
	bgRed: createStyle(41, 49),
	bgGreen: createStyle(42, 49),
	bgYellow: createStyle(43, 49),
	bgBlue: createStyle(44, 49),
	bgMagenta: createStyle(45, 49),
	bgCyan: createStyle(46, 49),
	bgWhite: createStyle(47, 49),
	bgBlackBright: createStyle(100, 49),
	bgRedBright: createStyle(101, 49),
	bgGreenBright: createStyle(102, 49),
	bgYellowBright: createStyle(103, 49),
	bgBlueBright: createStyle(104, 49),
	bgMagentaBright: createStyle(105, 49),
	bgCyanBright: createStyle(106, 49),
	bgWhiteBright: createStyle(107, 49),
});

/**
 * The text effects a logger style may combine.
 *
 * @since 1.0.0
 */
export const LoggerStyleEffect = Object.freeze({
	Reset: "reset",
	Bold: "bold",
	Dim: "dim",
	Italic: "italic",
	Underline: "underline",
	Inverse: "inverse",
	Hidden: "hidden",
	Strikethrough: "strikethrough",
} as const);

/**
 * The foreground colours a logger style may use.
 *
 * @since 1.0.0
 */
export const LoggerStyleText = Object.freeze({
	Black: "black",
	Red: "red",
	Green: "green",
	Yellow: "yellow",
	Blue: "blue",
	Magenta: "magenta",
	Cyan: "cyan",
	White: "white",
	Gray: "gray",
	BlackBright: "blackBright",
	RedBright: "redBright",
	GreenBright: "greenBright",
	YellowBright: "yellowBright",
	BlueBright: "blueBright",
	MagentaBright: "magentaBright",
	CyanBright: "cyanBright",
	WhiteBright: "whiteBright",
} as const);

/**
 * The background colours a logger style may use.
 *
 * @since 1.0.0
 */
export const LoggerStyleBackground = Object.freeze({
	Black: "bgBlack",
	Red: "bgRed",
	Green: "bgGreen",
	Yellow: "bgYellow",
	Blue: "bgBlue",
	Magenta: "bgMagenta",
	Cyan: "bgCyan",
	White: "bgWhite",
	BlackBright: "bgBlackBright",
	RedBright: "bgRedBright",
	GreenBright: "bgGreenBright",
	YellowBright: "bgYellowBright",
	BlueBright: "bgBlueBright",
	MagentaBright: "bgMagentaBright",
	CyanBright: "bgCyanBright",
	WhiteBright: "bgWhiteBright",
} as const);
