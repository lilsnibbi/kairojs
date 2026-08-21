/**
 * The events a pattern command passes through, from the moment a message is scanned for matches to
 * the moment the winning command has finished.
 *
 * They exist to make the selection visible: several commands can match one message, only one of
 * them runs, and the chance roll can discard even that one — logging these is the way to see why a
 * given message did or did not trigger anything.
 *
 * @since 1.0.0
 */
export const PatternCommandEvents = Object.freeze({
	/**
	 * Emitted when a command matched and passed its preconditions, but lost its chance roll.
	 */
	CommandNoLuck: "patternCommandNoLuck",

	/**
	 * Emitted once a message has been scanned, carrying every command that matched it in descending
	 * weight order.
	 */
	PreCommandRun: "patternCommandPreRun",

	/**
	 * Emitted when a matched command passed every precondition and won its chance roll.
	 */
	CommandAccepted: "patternCommandAccepted",

	/**
	 * Emitted when a precondition refused a matched command.
	 */
	CommandDenied: "patternCommandDenied",

	/**
	 * Emitted directly before the accepted command's handler runs.
	 */
	CommandRun: "patternCommandRun",

	/**
	 * Emitted after the handler resolves without throwing.
	 */
	CommandSuccess: "patternCommandSuccess",

	/**
	 * Emitted when the handler throws.
	 */
	CommandError: "patternCommandError",

	/**
	 * Emitted once the handler has settled, whichever way it went.
	 */
	CommandFinished: "patternCommandFinished",
} as const);
