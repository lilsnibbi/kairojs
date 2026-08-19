/**
 * What a command's cooldown is counted against.
 *
 * @since 1.0.0
 */
export const CooldownLevel = Object.freeze({
	Author: "author",
	Channel: "channel",
	Guild: "guild",
} as const);

/**
 * The points in {@link KairoClient}'s start-up a plugin can hook into.
 *
 * @since 1.0.0
 */
export const PluginHook = Object.freeze({
	PreGenericsInitialization: "preGenericsInitialization",
	PreInitialization: "preInitialization",
	PostInitialization: "postInitialization",
	PreLogin: "preLogin",
	PostLogin: "postLogin",
} as const);

/**
 * How widely a cooldown bucket is shared.
 *
 * @since 1.0.0
 */
export const BucketScope = Object.freeze({
	/**
	 * One bucket per channel.
	 */
	Channel: 0,

	/**
	 * A single bucket shared by everyone.
	 */
	Global: 1,

	/**
	 * One bucket per guild.
	 */
	Guild: 2,

	/**
	 * One bucket per user.
	 */
	User: 3,
} as const);

/**
 * What Kairo does when a locally defined application command differs from the one Discord already
 * has registered.
 *
 * @since 1.0.0
 */
export const RegisterBehavior = Object.freeze({
	/**
	 * Replace the registered command with the local one without comment.
	 */
	Overwrite: "OVERWRITE",

	/**
	 * Leave the registered command alone and report the mismatch to the console.
	 */
	LogToConsole: "LOG_TO_CONSOLE",

	/**
	 * Replace the registered command and log exactly which fields differed.
	 *
	 * Computing a full diff of a large command is not free, so prefer `Overwrite` in production
	 * where the extra detail is not being read.
	 */
	VerboseOverwrite: "VERBOSE_OVERWRITE",

	/**
	 * Hand Kairo full ownership of the application's commands: it registers, updates and removes
	 * them to match what the bot defines.
	 *
	 * This can only be set as the default behaviour, never per command. Under it:
	 *
	 * - per-command `idHints` are ignored and may be omitted.
	 * - per-command `behaviorWhenNotIdentical` is ignored and may be omitted.
	 * - application commands Kairo did not register are deleted, and the same applies to guild
	 *   commands in any guild named through `guildIds`.
	 */
	BulkOverwrite: "BULK_OVERWRITE",
} as const);

/**
 * Which kind of application command a registry entry describes.
 *
 * @internal
 * @since 1.0.0
 */
export const InternalRegistryAPIType = Object.freeze({
	ChatInput: 0,
	ContextMenu: 1,
} as const);

/**
 * The places a command may be allowed to run, as accepted by a command's `runIn` option.
 *
 * @since 1.0.0
 */
export const CommandOptionsRunTypeEnum = Object.freeze({
	Dm: "DM",
	GuildText: "GUILD_TEXT",
	GuildVoice: "GUILD_VOICE",
	GuildNews: "GUILD_NEWS",
	GuildNewsThread: "GUILD_NEWS_THREAD",
	GuildPublicThread: "GUILD_PUBLIC_THREAD",
	GuildPrivateThread: "GUILD_PRIVATE_THREAD",
	GuildAny: "GUILD_ANY",
} as const);

/**
 * The preconditions Kairo attaches to a command on its behalf, derived from the command's own
 * options rather than listed explicitly.
 *
 * @since 1.0.0
 */
export const CommandPreConditions = Object.freeze({
	Cooldown: "Cooldown",
	RunIn: "RunIn",
	NotSafeForWork: "NSFW",
	ClientPermissions: "ClientPermissions",
	UserPermissions: "UserPermissions",
} as const);
