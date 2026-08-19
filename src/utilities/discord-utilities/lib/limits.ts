/**
 * Limits Discord enforces on channels.
 *
 * @since 1.0.0
 */
export const ChannelLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a channel description.
	 */
	MaximumDescriptionLength: 1024,

	/**
	 * Maximum characters allowed in a channel name.
	 */
	MaximumNameLength: 100,
} as const);

/**
 * Limits Discord enforces on voice channels.
 *
 * @since 1.0.0
 */
export const VoiceChannelLimits = Object.freeze({
	/**
	 * Maximum viewers allowed per screen share.
	 */
	MaximumViewersPerScreenShare: 50,

	/**
	 * Maximum user limit of a voice channel.
	 */
	MaximumUserLimit: 99,
} as const);

/**
 * Limits Discord enforces on stage channels.
 *
 * @since 1.0.0
 */
export const StageChannelLimits = Object.freeze({
	/**
	 * Maximum user limit of a stage channel.
	 */
	MaximumUserLimit: 250,
} as const);

/**
 * Limits Discord enforces on text channels.
 *
 * @since 1.0.0
 */
export const TextChannelLimits = Object.freeze({
	/**
	 * Maximum pins allowed in a text channel.
	 */
	MaximumMessagePins: 50,
} as const);

/**
 * Limits Discord enforces on threads.
 *
 * @since 1.0.0
 */
export const ThreadLimits = Object.freeze({
	/**
	 * Minimum number of threads returnable from the threads API.
	 */
	MinimumThreadsToFetch: 1,

	/**
	 * Maximum number of threads returnable from the threads API.
	 */
	MaximumThreadsToFetch: 100,
} as const);

/**
 * Limits Discord enforces on embeds.
 *
 * @since 1.0.0
 */
export const EmbedLimits = Object.freeze({
	/**
	 * Maximum characters allowed in an embed's author name.
	 */
	MaximumAuthorNameLength: 256,

	/**
	 * Maximum characters allowed in an embed description.
	 */
	MaximumDescriptionLength: 4096,

	/**
	 * Maximum characters allowed in the name of an embed field.
	 */
	MaximumFieldNameLength: 256,

	/**
	 * Maximum fields allowed in an embed.
	 */
	MaximumFields: 25,

	/**
	 * Maximum characters allowed in the value of an embed field.
	 */
	MaximumFieldValueLength: 1024,

	/**
	 * Maximum characters allowed in an embed footer.
	 */
	MaximumFooterLength: 2048,

	/**
	 * Maximum characters allowed in an embed title.
	 */
	MaximumTitleLength: 256,

	/**
	 * Maximum characters allowed across an entire embed.
	 */
	MaximumTotalCharacters: 6000,
} as const);

/**
 * Limits Discord enforces on emojis.
 *
 * @since 1.0.0
 */
export const EmojiLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a custom guild emoji's name.
	 */
	MaximumEmojiNameLength: 32,

	/**
	 * Maximum size, in bytes, allowed for a custom guild emoji. Corresponds to 256KB.
	 */
	MaximumEmojiSize: 256_000,
} as const);

/**
 * Limits Discord enforces on guilds.
 *
 * @since 1.0.0
 */
export const GuildLimits = Object.freeze({
	/**
	 * Maximum channels allowed per guild, including category channels.
	 */
	MaximumChannels: 500,

	/**
	 * Maximum roles allowed in a guild.
	 */
	MaximumRoles: 250,

	/**
	 * Maximum scheduled or active events allowed in a guild.
	 */
	MaximumScheduledOrActiveEvents: 100,

	/**
	 * Minimum number of user guilds returnable from the user guilds API.
	 */
	MinimumUserGuildsToFetch: 1,

	/**
	 * Maximum number of user guilds returnable from the user guilds API.
	 */
	MaximumUserGuildsToFetch: 200,

	/**
	 * Maximum static emojis allowed in a guild.
	 */
	MaximumStaticEmojis: 50,

	/**
	 * Maximum animated emojis allowed in a guild.
	 */
	MaximumAnimatedEmojis: 50,

	/**
	 * Maximum emojis (static and animated combined) allowed in a guild.
	 */
	MaximumEmojis: 100,

	/**
	 * Maximum stickers allowed in a guild.
	 */
	MaximumStickers: 5,
} as const);

/**
 * Emoji and sticker limits for guilds with an active boost tier.
 *
 * @since 1.0.0
 */
export const PremiumGuildLimits = Object.freeze({
	TierOne: Object.freeze({
		MaximumStaticEmojis: 100,
		MaximumAnimatedEmojis: 100,
		MaximumEmojis: 200,
		MaximumStickers: 15,
	} as const),
	TierTwo: Object.freeze({
		MaximumStaticEmojis: 150,
		MaximumAnimatedEmojis: 150,
		MaximumEmojis: 300,
		MaximumStickers: 30,
	} as const),
	TierThree: Object.freeze({
		MaximumStaticEmojis: 250,
		MaximumAnimatedEmojis: 250,
		MaximumEmojis: 500,
		MaximumStickers: 60,
	} as const),
} as const);

/**
 * Limits Discord enforces on guild scheduled events.
 *
 * @since 1.0.0
 */
export const GuildScheduledEventLimits = Object.freeze({
	/**
	 * Maximum number of users returnable from the guild scheduled event users API.
	 */
	MaximumUsersToFetch: 100,
} as const);

/**
 * Limits Discord enforces on guild members.
 *
 * @since 1.0.0
 */
export const GuildMemberLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a guild member's display name.
	 */
	MaximumDisplayNameLength: 32,

	/**
	 * Minimum number of members returnable from the guild members API.
	 */
	MinimumMembersToFetch: 1,

	/**
	 * Maximum number of members returnable from the guild members API.
	 */
	MaximumMembersToFetch: 1000,
} as const);

/**
 * Limits Discord enforces on guild bans.
 *
 * @since 1.0.0
 */
export const GuildBansLimits = Object.freeze({
	/**
	 * Minimum number of bans returnable from the guild bans API.
	 */
	MinimumBansToFetch: 1,

	/**
	 * Maximum number of bans returnable from the guild bans API.
	 */
	MaximumBansToFetch: 1000,
} as const);

/**
 * Limits Discord enforces on message component interactions.
 *
 * @since 1.0.0
 */
export const InteractionLimits = Object.freeze({
	/**
	 * Maximum buttons allowed in a single action row.
	 */
	MaximumButtonsPerActionRow: 5,

	/**
	 * Maximum select menus allowed in a single action row.
	 */
	MaximumSelectMenusPerActionRow: 1,

	/**
	 * Maximum text inputs allowed in a single action row.
	 */
	MaximumTextInputsPerActionRow: 1,

	/**
	 * Maximum options allowed in a single select menu.
	 */
	MaximumOptionsInSelectMenus: 25,
} as const);

/**
 * Limits Discord enforces on application commands (slash commands).
 *
 * @since 1.0.0
 */
export const ApplicationCommandLimits = Object.freeze({
	/**
	 * Maximum characters allowed in an application command name.
	 */
	MaximumNameCharacters: 32,

	/**
	 * Maximum characters allowed in an application command description.
	 */
	MaximumDescriptionCharacters: 100,

	/**
	 * Maximum options allowed in an application command.
	 */
	MaximumOptionsLength: 25,

	/**
	 * Maximum combined characters allowed across an application command's name, description and
	 * value properties, its options (including subcommands and groups), and its choices.
	 */
	MaximumCombinedCharacters: 4000,
} as const);

/**
 * Limits Discord enforces on application command options.
 *
 * @since 1.0.0
 */
export const ApplicationCommandOptionLimits = Object.freeze({
	/**
	 * Maximum characters allowed in an option's name.
	 */
	MaximumNameCharacters: 32,

	/**
	 * Maximum characters allowed in an option's description.
	 */
	MaximumDescriptionCharacters: 100,

	/**
	 * Maximum choices allowed on an option.
	 */
	MaximumChoicesLength: 25,

	/**
	 * Maximum characters allowed in a string option's value.
	 */
	MaximumStringLength: 6000,
} as const);

/**
 * Limits Discord enforces on application command permissions.
 *
 * @since 1.0.0
 */
export const ApplicationCommandPermissionLimits = Object.freeze({
	/**
	 * Maximum permission overwrites allowed on an application command.
	 */
	MaximumPermissionsLength: 100,
} as const);

/**
 * Limits Discord enforces on message buttons.
 *
 * @since 1.0.0
 */
export const ButtonLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a button label.
	 */
	MaximumLabelCharacters: 80,

	/**
	 * Maximum characters allowed in a button custom ID.
	 */
	MaximumCustomIdCharacters: 100,
} as const);

/**
 * Limits Discord enforces on select menus.
 *
 * @since 1.0.0
 */
export const SelectMenuLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a select menu custom ID.
	 */
	MaximumCustomIdCharacters: 100,

	/**
	 * Maximum options allowed in a select menu.
	 */
	MaximumOptionsLength: 25,

	/**
	 * Maximum characters allowed in a select menu placeholder.
	 */
	MaximumPlaceholderCharacters: 150,

	/**
	 * Maximum "minimum values" allowed on a select menu.
	 */
	MaximumMinValuesSize: 25,

	/**
	 * Maximum "maximum values" allowed on a select menu.
	 */
	MaximumMaxValuesSize: 25,

	/**
	 * Maximum characters allowed in a select menu option's name.
	 */
	MaximumLengthOfNameOfOption: 100,

	/**
	 * Maximum characters allowed in a select menu option's description.
	 */
	MaximumLengthOfDescriptionOfOption: 100,

	/**
	 * Maximum characters allowed in a select menu option's value.
	 */
	MaximumLengthOfValueOfOption: 100,
} as const);

/**
 * Limits Discord enforces on messages.
 *
 * @since 1.0.0
 */
export const MessageLimits = Object.freeze({
	/**
	 * Maximum embeds allowed in a single message.
	 */
	MaximumEmbeds: 10,

	/**
	 * Maximum action rows allowed in a single message.
	 */
	MaximumActionRows: 5,

	/**
	 * Maximum characters allowed in a single message for a non-Nitro user.
	 */
	MaximumLength: 2000,

	/**
	 * Maximum characters allowed in a single message for a Nitro user.
	 */
	MaximumNitroLength: 4000,

	/**
	 * Maximum reactions allowed on a message.
	 */
	MaximumReactions: 20,

	/**
	 * Maximum upload size, in bytes, for a free user in a guild of boost tier 1 or below, or in
	 * DMs. Corresponds to 25MB.
	 */
	MaximumUploadSize: 25_000_000,

	/**
	 * Maximum upload size, in bytes, for a Nitro Basic user, in any guild or in DMs. Corresponds
	 * to 50MB.
	 */
	MaximumNitroBasicUploadSize: 50_000_000,

	/**
	 * Maximum upload size, in bytes, for a Nitro user, in any guild or in DMs. Corresponds to
	 * 500MB.
	 */
	MaximumNitroUploadSize: 500_000_000,

	/**
	 * Maximum upload size, in bytes, for a free user at each guild boost tier — 25MB, 25MB, 50MB
	 * and 100MB respectively.
	 */
	MaximumUploadSizeInGuild: [25_000_000, 25_000_000, 50_000_000, 100_000_000],

	/**
	 * Minimum number of messages returnable from the channel messages API.
	 */
	MinimumMessagesToFetch: 1,

	/**
	 * Maximum number of messages returnable from the channel messages API.
	 */
	MaximumMessagesToFetch: 100,

	/**
	 * Maximum request size, in bytes, when sending a message. Corresponds to 25MB.
	 */
	MaximumRequestSize: 25_000_000,

	/**
	 * Minimum number of messages that may be deleted in a single bulk delete request.
	 */
	MinimumMessagesToBulkDelete: 2,

	/**
	 * Maximum number of messages that may be deleted in a single bulk delete request.
	 */
	MaximumMessagesToBulkDelete: 100,
} as const);

/**
 * Limits Discord enforces on message reactions.
 *
 * @since 1.0.0
 */
export const ReactionLimits = Object.freeze({
	/**
	 * Minimum number of reactions returnable from the message reactions API.
	 */
	MinimumReactionToFetch: 1,

	/**
	 * Maximum number of reactions returnable from the message reactions API.
	 */
	MaximumReactionsToFetch: 100,
} as const);

/**
 * Limits Discord enforces on built-in moderation features.
 *
 * @since 1.0.0
 */
export const ModerationLimits = Object.freeze({
	/**
	 * Maximum duration, in seconds, of a guild timeout. Corresponds to 28 days.
	 */
	MaximumTimeoutDuration: 2_419_200,
} as const);

/**
 * Limits Discord enforces on roles.
 *
 * @since 1.0.0
 */
export const RoleLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a role name.
	 */
	MaximumNameLength: 100,
} as const);

/**
 * Limits Discord enforces on users and direct messages.
 *
 * @since 1.0.0
 */
export const UserLimits = Object.freeze({
	/**
	 * Maximum users allowed in a DM group.
	 */
	MaximumUsersPerDMGroup: 10,

	/**
	 * Maximum characters allowed in a user's "About Me" biography.
	 */
	MaximumBiographyLength: 190,
} as const);

/**
 * Limits Discord enforces on autocomplete interactions.
 *
 * @since 1.0.0
 */
export const AutoCompleteLimits = Object.freeze({
	/**
	 * Maximum options allowed in a single autocomplete response.
	 */
	MaximumAmountOfOptions: 25,

	/**
	 * Maximum characters allowed in an autocomplete option's name.
	 */
	MaximumLengthOfNameOfOption: 100,
} as const);

/**
 * Limits Discord enforces on modals.
 *
 * @since 1.0.0
 */
export const ModalLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a modal custom ID.
	 */
	MaximumCustomIdCharacters: 100,

	/**
	 * Maximum characters allowed in a modal title.
	 */
	MaximumTitleCharacters: 45,

	/**
	 * Maximum components allowed in a modal.
	 */
	MaximumComponents: 5,
} as const);

/**
 * Limits Discord enforces on modal text input components.
 *
 * @since 1.0.0
 */
export const TextInputLimits = Object.freeze({
	/**
	 * Maximum characters allowed in a text input custom ID.
	 */
	MaximumCustomIdCharacters: 100,

	/**
	 * Maximum characters allowed in a text input label.
	 */
	MaximumLabelCharacters: 45,

	/**
	 * Maximum characters allowed in a text input placeholder.
	 */
	MaximumPlaceholderCharacters: 100,

	/**
	 * Maximum characters allowed in a text input value.
	 */
	MaximumValueCharacters: 4000,
} as const);

/**
 * Limits Discord enforces on application role connections.
 *
 * @since 1.0.0
 */
export const ApplicationRoleConnectionLimits = Object.freeze({
	/**
	 * Maximum role connection metadata records an application can register.
	 */
	MaximumMetadataRecords: 5,

	/**
	 * Maximum characters allowed in a metadata value.
	 */
	MaximumMetadataValueLength: 100,

	/**
	 * Maximum characters allowed in a platform name.
	 */
	MaximumPlatformNameLength: 50,

	/**
	 * Maximum characters allowed in a platform username.
	 */
	MaximumPlatformUsernameLength: 100,
} as const);

/**
 * Limits Discord enforces on guild audit logs.
 *
 * @since 1.0.0
 */
export const GuildAuditLogsLimits = Object.freeze({
	/**
	 * Minimum number of entries returnable from the guild audit log API.
	 */
	MinimumEntriesToFetch: 1,

	/**
	 * Maximum number of entries returnable from the guild audit log API.
	 */
	MaximumEntriesToFetch: 100,
} as const);

/**
 * Limits Discord enforces on auto moderation rules.
 *
 * @since 1.0.0
 */
export const AutoModerationRuleLimits = Object.freeze({
	/**
	 * Maximum exempt roles a rule can have.
	 */
	MaximumExemptRoles: 20,

	/**
	 * Maximum exempt channels a rule can have.
	 */
	MaximumExemptChannels: 50,
} as const);

/**
 * Limits Discord enforces on auto moderation trigger types, per guild or channel.
 *
 * @since 1.0.0
 */
export const TriggerTypeLimits = Object.freeze({
	/**
	 * Maximum keyword triggers a guild can have.
	 */
	MaximumKeywordTriggersPerGuild: 6,

	/**
	 * Maximum mention-spam triggers a guild can have.
	 */
	MaximumSpamTriggersPerGuild: 1,

	/**
	 * Maximum keyword-preset triggers a channel can have.
	 */
	MaximumKeywordPresetTriggersPerChannel: 1,

	/**
	 * Maximum mention-spam triggers a channel can have.
	 */
	MaximumMentionSpamTriggersPerChannel: 1,
} as const);

/**
 * Limits Discord enforces on auto moderation trigger metadata.
 *
 * @since 1.0.0
 */
export const TriggerMetadataLimits = Object.freeze({
	/**
	 * Maximum substrings searched for in message content.
	 */
	MaximumKeywordFilters: 1000,

	/**
	 * Maximum characters allowed in a keyword filter.
	 */
	MaximumKeywordFilterLength: 60,

	/**
	 * Maximum regular expression patterns matched against message content.
	 */
	MaximumRegexPatterns: 10,

	/**
	 * Maximum characters allowed in a single regular expression pattern.
	 */
	MaximumCharactersPerRegexPattern: 260,

	/**
	 * Maximum substrings exempt from the keyword rule.
	 */
	MaximumKeywordAllowListLength: 100,

	/**
	 * Maximum characters per keyword exempt from the keyword rule.
	 */
	MaximumKeywordAllowListKeywordLength: 60,

	/**
	 * Maximum characters per keyword exempt from the keyword preset rule.
	 */
	MaximumKeywordPresetAllowListKeywordPresetLength: 60,

	/**
	 * Maximum substrings exempt from the keyword preset rule.
	 */
	MaximumKeywordPresetAllowListLength: 1000,

	/**
	 * Maximum unique role and user mentions allowed per message.
	 */
	MaximumMentionSpamTotalMentions: 50,
} as const);

/**
 * Limits Discord enforces on auto moderation action metadata.
 *
 * @since 1.0.0
 */
export const ActionMetadataLimits = Object.freeze({
	/**
	 * Maximum timeout duration, in seconds.
	 */
	MaximumTimeoutDurationSeconds: 2_419_200,

	/**
	 * Maximum characters allowed in a custom block message.
	 */
	MaximumCustomBlockMessageLength: 150,
} as const);

/**
 * Limits Discord enforces on allowed-mentions objects.
 *
 * @since 1.0.0
 */
export const AllowedMentionsLimits = Object.freeze({
	/**
	 * Maximum users allowed in an allowed-mentions object.
	 */
	MaximumUsers: 100,

	/**
	 * Maximum roles allowed in an allowed-mentions object.
	 */
	MaximumRoles: 100,
} as const);

/**
 * Limits Discord enforces on channel invites.
 *
 * @since 1.0.0
 */
export const ChannelInviteLimits = Object.freeze({
	/**
	 * Maximum age of an invite, in seconds.
	 */
	MaximumAgeSeconds: 604_800,

	/**
	 * Maximum uses allowed for an invite.
	 */
	MaximumUses: 100,
} as const);

/**
 * Limits Discord enforces on guild integrations.
 *
 * @since 1.0.0
 */
export const GuildIntegrationLimits = Object.freeze({
	/**
	 * Maximum integrations returnable from the guild integrations API.
	 */
	MaximumIntegrationsToFetch: 50,
} as const);

/**
 * Limits Discord enforces on stickers.
 *
 * @since 1.0.0
 */
export const StickerLimits = Object.freeze({
	/**
	 * Maximum characters allowed across a sticker's autocomplete/suggestion tags.
	 */
	MaximumTagsLength: 200,

	/**
	 * Maximum size, in bytes, allowed for a sticker. Corresponds to 512KB.
	 */
	MaximumStickerSize: 512_000,
} as const);
