import { Events as DiscordEvents } from "discord.js";

/**
 * Every event name Kairo knows about: the ones discord.js emits, re-exported so a bot only needs one
 * import, followed by the ones Kairo emits itself as commands and pieces move through their
 * lifecycle.
 *
 * Prefer these constants over raw strings — a typo in a string silently produces a listener that
 * never fires, whereas a typo here fails to compile.
 *
 * @since 1.0.0
 */
export const Events = Object.freeze({
	// ---------------------------------------------------------------------------
	// Events re-exported from discord.js
	// ---------------------------------------------------------------------------
	ApplicationCommandPermissionsUpdate:
		DiscordEvents.ApplicationCommandPermissionsUpdate,
	AutoModerationActionExecution: DiscordEvents.AutoModerationActionExecution,
	AutoModerationRuleCreate: DiscordEvents.AutoModerationRuleCreate,
	AutoModerationRuleDelete: DiscordEvents.AutoModerationRuleDelete,
	AutoModerationRuleUpdate: DiscordEvents.AutoModerationRuleUpdate,
	CacheSweep: DiscordEvents.CacheSweep,
	ChannelCreate: DiscordEvents.ChannelCreate,
	ChannelDelete: DiscordEvents.ChannelDelete,
	ChannelPinsUpdate: DiscordEvents.ChannelPinsUpdate,
	ChannelUpdate: DiscordEvents.ChannelUpdate,
	ClientReady: DiscordEvents.ClientReady,
	Debug: DiscordEvents.Debug,
	Error: DiscordEvents.Error,
	GuildAuditLogEntryCreate: DiscordEvents.GuildAuditLogEntryCreate,
	GuildAvailable: DiscordEvents.GuildAvailable,
	GuildBanAdd: DiscordEvents.GuildBanAdd,
	GuildBanRemove: DiscordEvents.GuildBanRemove,
	GuildCreate: DiscordEvents.GuildCreate,
	GuildDelete: DiscordEvents.GuildDelete,
	GuildEmojiCreate: DiscordEvents.GuildEmojiCreate,
	GuildEmojiDelete: DiscordEvents.GuildEmojiDelete,
	GuildEmojiUpdate: DiscordEvents.GuildEmojiUpdate,
	GuildIntegrationsUpdate: DiscordEvents.GuildIntegrationsUpdate,
	GuildMemberAdd: DiscordEvents.GuildMemberAdd,
	GuildMemberAvailable: DiscordEvents.GuildMemberAvailable,
	GuildMemberRemove: DiscordEvents.GuildMemberRemove,
	GuildMembersChunk: DiscordEvents.GuildMembersChunk,
	GuildMemberUpdate: DiscordEvents.GuildMemberUpdate,
	GuildRoleCreate: DiscordEvents.GuildRoleCreate,
	GuildRoleDelete: DiscordEvents.GuildRoleDelete,
	GuildRoleUpdate: DiscordEvents.GuildRoleUpdate,
	GuildScheduledEventCreate: DiscordEvents.GuildScheduledEventCreate,
	GuildScheduledEventDelete: DiscordEvents.GuildScheduledEventDelete,
	GuildScheduledEventUpdate: DiscordEvents.GuildScheduledEventUpdate,
	GuildScheduledEventUserAdd: DiscordEvents.GuildScheduledEventUserAdd,
	GuildScheduledEventUserRemove: DiscordEvents.GuildScheduledEventUserRemove,
	GuildStickerCreate: DiscordEvents.GuildStickerCreate,
	GuildStickerDelete: DiscordEvents.GuildStickerDelete,
	GuildStickerUpdate: DiscordEvents.GuildStickerUpdate,
	GuildUnavailable: DiscordEvents.GuildUnavailable,
	GuildUpdate: DiscordEvents.GuildUpdate,
	InteractionCreate: DiscordEvents.InteractionCreate,
	Invalidated: DiscordEvents.Invalidated,
	InviteCreate: DiscordEvents.InviteCreate,
	InviteDelete: DiscordEvents.InviteDelete,
	MessageBulkDelete: DiscordEvents.MessageBulkDelete,
	MessageCreate: DiscordEvents.MessageCreate,
	MessageDelete: DiscordEvents.MessageDelete,
	MessageReactionAdd: DiscordEvents.MessageReactionAdd,
	MessageReactionRemove: DiscordEvents.MessageReactionRemove,
	MessageReactionRemoveAll: DiscordEvents.MessageReactionRemoveAll,
	MessageReactionRemoveEmoji: DiscordEvents.MessageReactionRemoveEmoji,
	MessageUpdate: DiscordEvents.MessageUpdate,
	PresenceUpdate: DiscordEvents.PresenceUpdate,
	Raw: DiscordEvents.Raw,
	ShardDisconnect: DiscordEvents.ShardDisconnect,
	ShardError: DiscordEvents.ShardError,
	ShardReady: DiscordEvents.ShardReady,
	ShardReconnecting: DiscordEvents.ShardReconnecting,
	ShardResume: DiscordEvents.ShardResume,
	StageInstanceCreate: DiscordEvents.StageInstanceCreate,
	StageInstanceDelete: DiscordEvents.StageInstanceDelete,
	StageInstanceUpdate: DiscordEvents.StageInstanceUpdate,
	ThreadCreate: DiscordEvents.ThreadCreate,
	ThreadDelete: DiscordEvents.ThreadDelete,
	ThreadListSync: DiscordEvents.ThreadListSync,
	ThreadMembersUpdate: DiscordEvents.ThreadMembersUpdate,
	ThreadMemberUpdate: DiscordEvents.ThreadMemberUpdate,
	ThreadUpdate: DiscordEvents.ThreadUpdate,
	TypingStart: DiscordEvents.TypingStart,
	UserUpdate: DiscordEvents.UserUpdate,
	VoiceServerUpdate: DiscordEvents.VoiceServerUpdate,
	VoiceStateUpdate: DiscordEvents.VoiceStateUpdate,
	Warn: DiscordEvents.Warn,
	WebhooksUpdate: DiscordEvents.WebhooksUpdate,

	// ---------------------------------------------------------------------------
	// Events emitted by Kairo itself
	// ---------------------------------------------------------------------------
	/**
	 * Emitted when a message is created that was not sent by bots or webhooks.
	 */
	PreMessageParsed: "preMessageParsed",
	/**
	 * Emitted when a message is created consisting of only the bot's mention.
	 */
	MentionPrefixOnly: "mentionPrefixOnly",
	/**
	 * Emitted when a message is created that does not start with a valid prefix.
	 */
	NonPrefixedMessage: "nonPrefixedMessage",
	/**
	 * Emitted when a message is created that does starts with a valid prefix.
	 */
	PrefixedMessage: "prefixedMessage",
	/**
	 * Emitted when a message starts with a valid prefix but does not include a command name.
	 */
	UnknownMessageCommandName: "unknownMessageCommandName",
	/**
	 * Emitted when the name of a sent message command does not match any loaded commands.
	 */
	UnknownMessageCommand: "unknownMessageCommand",
	/**
	 * Emitted when a message command is executed but a `messageRun` method is not found.
	 */
	CommandDoesNotHaveMessageCommandHandler:
		"commandDoesNotHaveMessageCommandHandler",
	/**
	 * Emitted before the `messageRun` method of a command is run.
	 */
	PreMessageCommandRun: "preMessageCommandRun",
	/**
	 * Emitted when a precondition denies a message command from being run.
	 */
	MessageCommandDenied: "messageCommandDenied",
	/**
	 * Emitted when a message command passes all precondition checks, if any.
	 */
	MessageCommandAccepted: "messageCommandAccepted",
	/**
	 * Emitted directly before a message command is run.
	 */
	MessageCommandRun: "messageCommandRun",
	/**
	 * Emitted after a message command runs successfully.
	 */
	MessageCommandSuccess: "messageCommandSuccess",
	/**
	 * Emitted after a message command runs unsuccessfully.
	 */
	MessageCommandError: "messageCommandError",
	/**
	 * Emitted directly after a message command finished running, regardless of the outcome.
	 */
	MessageCommandFinish: "messageCommandFinish",
	/**
	 * Emitted after the bot unsuccessfully tried to start typing when a command is executed.
	 */
	MessageCommandTypingError: "messageCommandTypingError",
	/**
	 * Emitted when an error is encountered when executing a listener.
	 */
	ListenerError: "listenerError",
	/**
	 * Emitted when an error is encountered when handling the command application command registry.
	 */
	CommandApplicationCommandRegistryError:
		"commandApplicationCommandRegistryError",
	/**
	 * Emitted when the application command registries are being initialized.
	 */
	ApplicationCommandRegistriesInitialising:
		"applicationCommandRegistriesInitialising",
	/**
	 * Emitted once the application command registries have been initialized.
	 */
	ApplicationCommandRegistriesRegistered:
		"applicationCommandRegistriesRegistered",
	/**
	 * Emitted when handling the command registries in bulk overwrite mode.
	 */
	ApplicationCommandRegistriesBulkOverwrite:
		"applicationCommandRegistriesBulkOverwrite",
	/**
	 * Emitted when an error is encountered when handling the command registries in bulk overwrite mode.
	 */
	ApplicationCommandRegistriesBulkOverwriteError:
		"applicationCommandRegistriesBulkOverwriteError",
	/**
	 * Emitted after a piece is loaded.
	 */
	PiecePostLoad: "piecePostLoad",
	/**
	 * Emitted when a piece is unloaded.
	 */
	PieceUnload: "pieceUnload",
	/**
	 * Emitted when a plugin is loaded.
	 */
	PluginLoaded: "pluginLoaded",
	/**
	 * Emitted when the `parse` method of an interaction handler passes successfully (no errors are encountered)
	 * Use the {@link option} parameter to determine if `some` or `none` was passed.
	 */
	InteractionHandlerParseSuccess: "interactionHandlerParseSuccess",
	/**
	 * Emitted when the `parse` method of an interaction handler passes successfully (no errors are encountered)
	 * and `some` is returned.
	 */
	InteractionHandlerParseSome: "interactionHandlerParseSome",
	/**
	 * Emitted when the `parse` method of an interaction handler passes successfully (no errors are encountered)
	 * and `none` is returned.
	 */
	InteractionHandlerParseNone: "interactionHandlerParseNone",
	/**
	 * Emitted when the `parse` method of an interaction handler encounters an error.
	 */
	InteractionHandlerParseError: "interactionHandlerParseError",
	/**
	 * Emitted when an error is encountered when executing an interaction handler.
	 */
	InteractionHandlerError: "interactionHandlerError",
	/**
	 * Emitted when an autocomplete interaction is recieved.
	 */
	PossibleAutocompleteInteraction: "possibleAutocompleteInteraction",
	/**
	 * Emitted after an autocomplete interaction handler runs successfully.
	 */
	CommandAutocompleteInteractionSuccess:
		"commandAutocompleteInteractionSuccess",
	/**
	 * Emitted when an error is encountered when executing an autocomplete interaction handler.
	 */
	CommandAutocompleteInteractionError: "commandAutocompleteInteractionError",
	/**
	 * Emitted when a chat input command interaction is recieved.
	 */
	PossibleChatInputCommand: "possibleChatInputCommand",
	/**
	 * Emitted when the name of a sent chat input command does not match any loaded commands.
	 */
	UnknownChatInputCommand: "unknownChatInputCommand",
	/**
	 * Emitted when a chat input command is executed but a `chatInputRun` method is not found.
	 */
	CommandDoesNotHaveChatInputCommandHandler:
		"commandDoesNotHaveChatInputCommandHandler",
	/**
	 * Emitted before the `chatInputRun` method of a command is run.
	 */
	PreChatInputCommandRun: "preChatInputCommandRun",
	/**
	 * Emitted when a precondition denies a chat input command from being run.
	 */
	ChatInputCommandDenied: "chatInputCommandDenied",
	/**
	 * Emitted when a chat input command passes all precondition checks, if any.
	 */
	ChatInputCommandAccepted: "chatInputCommandAccepted",
	/**
	 * Emitted directly before a chat input command is run.
	 */
	ChatInputCommandRun: "chatInputCommandRun",
	/**
	 * Emitted after a chat input command runs successfully.
	 */
	ChatInputCommandSuccess: "chatInputCommandSuccess",
	/**
	 * Emitted after a chat input command runs unsuccessfully.
	 */
	ChatInputCommandError: "chatInputCommandError",
	/**
	 * Emitted directly after a chat input command finished running, regardless of the outcome.
	 */
	ChatInputCommandFinish: "chatInputCommandFinish",
	/**
	 * Emitted when a context menu interaction is recieved.
	 */
	PossibleContextMenuCommand: "possibleContextMenuCommand",
	/**
	 * Emitted when the name of a sent context menu command does not match any loaded commands.
	 */
	UnknownContextMenuCommand: "unknownContextMenuCommand",
	/**
	 * Emitted when a chat input command is executed but a `contextMenuRun` method is not found.
	 */
	CommandDoesNotHaveContextMenuCommandHandler:
		"commandDoesNotHaveContextMenuCommandHandler",
	/**
	 * Emitted before the `contextMenuRun` method of a command is run.
	 */
	PreContextMenuCommandRun: "preContextMenuCommandRun",
	/**
	 * Emitted when a precondition denies a context menu command from being run.
	 */
	ContextMenuCommandDenied: "contextMenuCommandDenied",
	/**
	 * Emitted when a context menu command passes all precondition checks, if any.
	 */
	ContextMenuCommandAccepted: "contextMenuCommandAccepted",
	/**
	 * Emitted directly before a context menu command is run.
	 */
	ContextMenuCommandRun: "contextMenuCommandRun",
	/**
	 * Emitted after a context menu command runs successfully.
	 */
	ContextMenuCommandSuccess: "contextMenuCommandSuccess",
	/**
	 * Emitted after a context menu command runs unsuccessfully.
	 */
	ContextMenuCommandError: "contextMenuCommandError",
	/**
	 * Emitted directly after a context menu command finished running, regardless of the outcome.
	 */
	ContextMenuCommandFinish: "contextMenuCommandFinish",
} as const);
