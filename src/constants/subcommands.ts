/**
 * The preconditions Kairo attaches to a subcommand on its behalf, derived from the subcommand
 * mapping's own options rather than listed explicitly.
 *
 * A subcommand gets its own cooldown precondition rather than reusing the command-level one,
 * because the bucket has to be keyed per subcommand: `config set` and `config show` are separate
 * actions and should not spend each other's allowance.
 *
 * @since 1.0.0
 */
export const SubcommandCommandPreConditions = Object.freeze({
	PluginSubcommandCooldown: "PluginSubcommandCooldown",
} as const);

/**
 * The identifiers attached to the errors the subcommand preconditions raise.
 *
 * @since 1.0.0
 */
export const SubcommandIdentifiers = Object.freeze({
	/**
	 * Raised when a subcommand is invoked while its cooldown bucket is still spent.
	 */
	SubcommandPreconditionCooldown: "subcommandPreconditionCooldown",
} as const);

/**
 * The events a {@link Subcommand} emits as it routes an invocation to one of its mappings.
 *
 * These mirror the command-level events, but carry the matched mapping alongside the command, so a
 * handler can tell which subcommand was actually reached.
 *
 * @since 1.0.0
 */
export const SubcommandPluginEvents = Object.freeze({
	/**
	 * Emitted when a subcommand precondition denies a chat input subcommand.
	 */
	ChatInputSubcommandDenied: "chatInputSubcommandDenied",

	/**
	 * Emitted directly before a chat input subcommand's handler runs.
	 */
	ChatInputSubcommandRun: "chatInputSubcommandRun",

	/**
	 * Emitted after a chat input subcommand's handler resolves without throwing.
	 */
	ChatInputSubcommandSuccess: "chatInputSubcommandSuccess",

	/**
	 * Emitted when a chat input subcommand's handler throws.
	 */
	ChatInputSubcommandError: "chatInputSubcommandError",

	/**
	 * Emitted when no mapping matched the subcommand Discord reported.
	 */
	ChatInputSubcommandNoMatch: "chatInputSubcommandNoMatch",

	/**
	 * Emitted when a subcommand precondition denies a message subcommand.
	 */
	MessageSubcommandDenied: "messageSubcommandDenied",

	/**
	 * Emitted directly before a message subcommand's handler runs.
	 */
	MessageSubcommandRun: "messageSubcommandRun",

	/**
	 * Emitted after a message subcommand's handler resolves without throwing.
	 */
	MessageSubcommandSuccess: "messageSubcommandSuccess",

	/**
	 * Emitted when a message subcommand's handler throws.
	 */
	MessageSubcommandError: "messageSubcommandError",

	/**
	 * Emitted when neither a named mapping nor a default one matched what the caller typed.
	 */
	MessageSubcommandNoMatch: "messageSubcommandNoMatch",

	/**
	 * Emitted when a matched mapping has no `messageRun` to route to.
	 */
	SubcommandMappingIsMissingMessageCommandHandler:
		"subcommandMappingIsMissingMessageCommandHandler",

	/**
	 * Emitted when a matched mapping has no `chatInputRun` to route to.
	 */
	SubcommandMappingIsMissingChatInputCommandHandler:
		"subcommandMappingIsMissingChatInputCommandHandler",
} as const);

/**
 * The identifiers attached to the errors and no-match reports the subcommand router produces.
 *
 * @since 1.0.0
 */
export const SubcommandPluginIdentifiers = Object.freeze({
	/**
	 * Reported when a message subcommand could not be matched.
	 */
	MessageSubcommandNoMatch: "messageSubcommandNoMatch",

	/**
	 * Reported when a chat input subcommand could not be matched.
	 */
	ChatInputSubcommandNoMatch: "chatInputSubcommandNoMatch",

	/**
	 * Raised when a mapping names a method by string that the class never implemented.
	 */
	SubcommandNotFound: "subcommandNotFound",
} as const);
