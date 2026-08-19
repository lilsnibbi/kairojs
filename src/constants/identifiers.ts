/**
 * Every identifier Kairo attaches to the errors it raises.
 *
 * Identifiers are stable, machine-readable keys rather than prose, which is what makes it practical
 * to translate an error message or branch on a specific failure without matching on text.
 *
 * @since 1.0.0
 */
export const Identifiers = Object.freeze({
	ArgsMissing: "argsMissing",
	ArgsUnavailable: "argsUnavailable",

	ArgumentBooleanError: "booleanError",
	ArgumentChannelError: "channelError",
	ArgumentDateError: "dateError",
	ArgumentDateTooEarly: "dateTooEarly",
	ArgumentDateTooFar: "dateTooFar",
	ArgumentDMChannelError: "dmChannelError",
	ArgumentEmojiError: "emojiError",
	ArgumentFloatError: "floatError",
	ArgumentFloatTooLarge: "floatTooLarge",
	ArgumentFloatTooSmall: "floatTooSmall",
	ArgumentGuildError: "guildError",
	ArgumentGuildCategoryChannelError: "categoryChannelError",
	ArgumentGuildChannelError: "guildChannelError",
	ArgumentGuildChannelMissingGuildError: "guildChannelMissingGuildError",
	ArgumentGuildNewsChannelError: "guildNewsChannelError",
	ArgumentGuildNewsThreadChannelError: "guildNewsThreadChannelError",
	ArgumentGuildPrivateThreadChannelError: "guildPrivateThreadChannelError",
	ArgumentGuildPublicThreadChannelError: "guildPublicThreadChannelError",
	ArgumentGuildStageVoiceChannelError: "guildStageVoiceChannelError",
	ArgumentGuildTextChannelError: "guildTextChannelError",
	ArgumentGuildThreadChannelError: "guildThreadChannelError",
	ArgumentGuildVoiceChannelError: "guildVoiceChannelError",
	ArgumentHyperlinkError: "hyperlinkError",
	ArgumentIntegerError: "integerError",
	ArgumentIntegerTooLarge: "integerTooLarge",
	ArgumentIntegerTooSmall: "integerTooSmall",
	ArgumentMemberError: "memberError",
	ArgumentMemberMissingGuild: "memberMissingGuild",
	ArgumentMessageError: "messageError",
	ArgumentNumberError: "numberError",
	ArgumentNumberTooLarge: "numberTooLarge",
	ArgumentNumberTooSmall: "numberTooSmall",
	ArgumentRoleError: "roleError",
	ArgumentRoleMissingGuild: "roleMissingGuild",
	ArgumentStringTooLong: "stringTooLong",
	ArgumentStringTooShort: "stringTooShort",
	ArgumentUserError: "userError",
	ArgumentEnumEmptyError: "enumEmptyError",
	ArgumentEnumError: "enumError",

	CommandDisabled: "commandDisabled",

	PreconditionCooldown: "preconditionCooldown",
	PreconditionNSFW: "preconditionNsfw",
	PreconditionClientPermissions: "preconditionClientPermissions",
	PreconditionClientPermissionsNoClient:
		"preconditionClientPermissionsNoClient",
	PreconditionClientPermissionsNoPermissions:
		"preconditionClientPermissionsNoPermissions",
	PreconditionRunIn: "preconditionRunIn",
	PreconditionUserPermissions: "preconditionUserPermissions",
	PreconditionUserPermissionsNoPermissions:
		"preconditionUserPermissionsNoPermissions",

	PreconditionUnavailable: "preconditionUnavailable",

	PreconditionMissingMessageHandler: "preconditionMissingMessageHandler",
	PreconditionMissingChatInputHandler: "preconditionMissingChatInputHandler",
	PreconditionMissingContextMenuHandler:
		"preconditionMissingContextMenuHandler",
} as const);
