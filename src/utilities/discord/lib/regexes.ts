/**
 * Matches a channel mention and captures its ID.
 *
 * @remark Capture group `id` is the channel's ID.
 *
 * @since 1.0.0
 */
export const ChannelMentionRegex = /^<#(?<id>\d{17,20})>$/;

/**
 * Matches a `channelId-messageId` pair, the format Discord copies to the clipboard when
 * Shift-clicking a message's "Copy ID" button.
 *
 * @remark Capture group `channelId` is the channel's ID.
 * @remark Capture group `messageId` is the message's ID.
 *
 * @since 1.0.0
 */
export const ChannelMessageRegex =
	/^(?<channelId>\d{17,20})-(?<messageId>\d{17,20})$/;

/**
 * Matches a link on any known Discord hostname.
 *
 * @remark The match is case-insensitive.
 * @remark Capture group `subdomain` is the URL's subdomain.
 * @remark Capture group `hostname` is the base hostname — usually `discord`, but also
 * `discordmerch`, `discordstatus`, `dis` or `discordapp`.
 * @remark Capture group `tld` is the top-level domain, without the leading `.`.
 *
 * @since 1.0.0
 */
export const DiscordHostnameRegex =
	/(?<subdomain>\w+)\.?(?<hostname>dis(?:cord)?(?:app|merch|status)?)\.(?<tld>com|g(?:d|g|ift)|(?:de(?:sign|v))|media|new|store|net)/i;

/**
 * Matches a Discord invite link and captures its code.
 *
 * @remark Capture group `code` is the invite's unique code.
 *
 * @since 1.0.0
 */
export const DiscordInviteLinkRegex =
	/(?:^|\b)discord(?:(?:app)?\.com\/invite|\.gg(?:\/invite)?)\/(?<code>[\w-]{2,255})(?:$|\b)/gi;

/**
 * Matches a full custom Discord emoji token — animated or static — and captures its parts.
 *
 * @remark Capture group `animated` is present when the emoji is animated.
 * @remark Capture group `name` is the emoji's name, as typed in a message.
 * @remark Capture group `id` is the emoji's ID.
 *
 * @since 1.0.0
 */
export const EmojiRegex =
	/^(?:<(?<animated>a)?:(?<name>\w{2,32}):)?(?<id>\d{17,21})>?$/;

/**
 * Matches any custom Discord emoji token as a substring within a larger string, unlike
 * {@link EmojiRegex} which anchors to the whole string.
 *
 * @since 1.0.0
 */
export const FormattedCustomEmoji = /<a?:\w{2,32}:\d{17,20}>/;

/**
 * Like {@link FormattedCustomEmoji}, but captures the emoji's parts.
 *
 * @remark Capture group `animated` is present when the emoji is animated.
 * @remark Capture group `name` is the emoji's name, as typed in a message.
 * @remark Capture group `id` is the emoji's ID.
 *
 * @since 1.0.0
 */
export const FormattedCustomEmojiWithGroups =
	/(?<animated>a?):(?<name>[^:]+):(?<id>\d{17,20})/;

/**
 * Matches any URL beginning with `http` or `https`.
 *
 * @see {@link WebSocketUrlRegex} for WebSocket URLs.
 *
 * @since 1.0.0
 */
export const HttpUrlRegex = /^https?:\/\//;

/**
 * Matches a shareable Discord message link and captures the guild, channel and message IDs.
 *
 * @remark Capture group `guildId` is the ID of the guild the message was sent in, or `@me` for DMs.
 * @remark Capture group `channelId` is the ID of the channel the message was sent in.
 * @remark Capture group `messageId` is the message's own ID.
 *
 * @since 1.0.0
 */
export const MessageLinkRegex =
	/^(?:https:\/\/)?(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?<guildId>(?:\d{17,20}|@me))\/(?<channelId>\d{17,20})\/(?<messageId>\d{17,20})$/;

/**
 * Matches a custom Discord emoji token with the wrapping `<...>` symbols stripped, so a match can
 * be sent directly inside a message. Otherwise identical to {@link FormattedCustomEmoji}.
 *
 * @since 1.0.0
 */
export const ParsedCustomEmoji = /a?:\w{2,32}:\d{17,20}/;

/**
 * Like {@link ParsedCustomEmoji}, but captures the emoji's parts. Otherwise identical to
 * {@link FormattedCustomEmojiWithGroups}.
 *
 * @remark Capture group `animated` is present when the emoji is animated.
 * @remark Capture group `name` is the emoji's name, as typed in a message.
 * @remark Capture group `id` is the emoji's ID.
 *
 * @since 1.0.0
 */
export const ParsedCustomEmojiWithGroups =
	/(?<animated>a?):(?<name>[^:]+):(?<id>\d{17,20})/;

/**
 * Matches a role mention and captures its ID.
 *
 * @remark Capture group `id` is the role's ID.
 *
 * @since 1.0.0
 */
export const RoleMentionRegex = /^<@&(?<id>\d{17,20})>$/;

/**
 * Matches any bare Discord snowflake ID.
 *
 * @remark Capture group `id` is the snowflake itself.
 *
 * @since 1.0.0
 */
export const SnowflakeRegex = /^(?<id>\d{17,20})$/;

/**
 * Matches a Discord authentication token and captures it under whichever of two named groups
 * applies.
 *
 * @remark Capture group `mfaToken` matches a token for a user with multi-factor authentication
 * enabled.
 * @remark Capture group `basicToken` matches a token for a user without multi-factor
 * authentication, or for a bot application.
 * @remark Exactly one of the two groups is defined for a valid token; if both are undefined, the
 * token is invalid.
 *
 * @since 1.0.0
 */
export const TokenRegex =
	/(?<mfaToken>mfa\.[a-z0-9_-]{20,})|(?<basicToken>[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27})/i;

/**
 * Matches a user mention and captures its ID.
 *
 * @remark Capture group `id` is the user's ID.
 *
 * @since 1.0.0
 */
export const UserOrMemberMentionRegex = /^<@!?(?<id>\d{17,20})>$/;

/**
 * Matches any WebSocket URL beginning with `ws` or `wss`.
 *
 * @see {@link HttpUrlRegex} for regular HTTP(S) URLs.
 *
 * @since 1.0.0
 */
export const WebSocketUrlRegex = /^wss?:\/\//;

/**
 * Matches a Discord webhook URL and captures its ID and token.
 *
 * @remark Capture group `url` is the full webhook URL.
 * @remark Capture group `id` is the webhook's ID.
 * @remark Capture group `token` is the webhook's token.
 *
 * @since 1.0.0
 */
export const WebhookRegex =
	/(?<url>^https:\/\/(?:(?:canary|ptb).)?discord(?:app)?.com\/api(?:\/v\d+)?\/webhooks\/(?<id>\d+)\/(?<token>[\w-]+)\/?$)/;
