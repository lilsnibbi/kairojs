import type { Message, Snowflake } from "discord.js";
import type { KairoClient } from "@/client.ts";
import type { BucketScope } from "./constants.d.ts";
import type { Logger, LoggerOptions } from "./logger.d.ts";
import type { Awaitable } from "./utilities/common.d.ts";

/**
 * A prefix a message command may be invoked with.
 *
 * - `string`: one prefix, e.g. `"!"`.
 * - `string[]`: several, e.g. `["!", "."]`, tried in order.
 * - `null`: none, which restricts the bot to mention prefixes.
 *
 * @since 1.0.0
 */
export type Prefix = string | readonly string[] | null;

/**
 * Resolves the prefix or prefixes a given message is allowed to use.
 *
 * @since 1.0.0
 */
export type PrefixHook = (message: Message) => Awaitable<Prefix>;

/**
 * How the client's logger is set up.
 *
 * Pass an {@link ClientLoggerOptions.instance} to take over logging entirely, or leave it out and
 * configure the built-in logger through the remaining options.
 *
 * @since 1.0.0
 */
export interface ClientLoggerOptions extends LoggerOptions {
	/**
	 * The logger to use instead of the built-in one.
	 *
	 * @default a new built-in logger
	 */
	instance?: Logger;
}

/**
 * The cooldown applied to a command that does not declare one of its own.
 *
 * @since 1.0.0
 */
export interface CooldownOptions {
	/**
	 * How widely the cooldown bucket is shared.
	 *
	 * @default BucketScope.User
	 */
	scope?: BucketScope;

	/**
	 * How long the window lasts, in milliseconds.
	 */
	delay?: number;

	/**
	 * How many uses fit inside one window before the cooldown bites.
	 *
	 * @default 1
	 */
	limit?: number;

	/**
	 * Users the cooldown never applies to — bot owners and staff, typically.
	 */
	filteredUsers?: Snowflake[];

	/**
	 * Commands, by name, the cooldown never applies to.
	 */
	filteredCommands?: string[];
}

/**
 * Everything Kairo adds on top of discord.js' own client options.
 *
 * These are merged into discord.js' `ClientOptions`, so they are passed to the client's constructor
 * alongside `intents`, `partials` and the rest.
 *
 * @since 1.0.0
 */
export interface KairoClientOptions {
	/**
	 * The directory piece folders are looked for under.
	 *
	 * Setting it to `null` stops the client from registering any path on its own, leaving you to
	 * register each store's directories yourself or to load pieces one at a time.
	 *
	 * @default undefined
	 */
	baseUserDirectory?: URL | string | null;

	/**
	 * Whether a command's name may be typed in any casing.
	 *
	 * @default false
	 */
	caseInsensitiveCommands?: boolean | null;

	/**
	 * Whether a prefix may be typed in any casing.
	 *
	 * @default false
	 */
	caseInsensitivePrefixes?: boolean | null;

	/**
	 * The prefix used when {@link KairoClientOptions.fetchPrefix} is not replaced. With `null`, only
	 * a mention triggers the bot's commands.
	 *
	 * @default null
	 */
	defaultPrefix?: Prefix;

	/**
	 * An alternative to a plain or mention prefix, letting commands be invoked with natural
	 * language.
	 *
	 * @example
	 * ```typescript
	 * /^(hey +)?bot[,! ]/i
	 *
	 * // Matches:
	 * // - hey bot,
	 * // - hey bot!
	 * // - hey bot
	 * // - bot,
	 * // - bot!
	 * // - bot
	 * ```
	 */
	regexPrefix?: RegExp;

	/**
	 * Resolves the prefix for a given message. Replace it to make the prefix depend on the guild,
	 * the user, or anything else.
	 *
	 * @default () => client.options.defaultPrefix
	 */
	fetchPrefix?: PrefixHook;

	/**
	 * The client's own ID, used to recognise mention prefixes. Filled in automatically once the
	 * client is ready.
	 *
	 * @default this.client.user?.id ?? null
	 */
	id?: Snowflake;

	/**
	 * How the client's logger is set up.
	 *
	 * @default { level: LogLevel.Info }
	 */
	logger?: ClientLoggerOptions;

	/**
	 * Whether the piece loader reports every step it takes.
	 *
	 * Leave it out and the loader reports whenever the logger accepts trace-level entries, which is
	 * usually what you want; set it explicitly to force the behaviour either way.
	 *
	 * @default container.logger.has(LogLevel.Trace)
	 */
	enableLoaderTraceLoggings?: boolean;

	/**
	 * Whether the built-in listeners that report the progress of application command registration
	 * are loaded. They cover the events emitted when registration starts and when it finishes.
	 *
	 * @default true
	 */
	loadApplicationCommandRegistriesStatusListeners?: boolean;

	/**
	 * Whether the built-in listeners that report unhandled errors to the logger are loaded.
	 *
	 * @default true
	 */
	loadDefaultErrorListeners?: boolean;

	/**
	 * Whether the built-in listeners that turn incoming messages into command runs are loaded.
	 * Message commands do nothing without them.
	 *
	 * @default false
	 */
	loadMessageCommandListeners?: boolean;

	/**
	 * Whether the bot starts typing as soon as a command is accepted.
	 *
	 * @default false
	 */
	typing?: boolean;

	/**
	 * The cooldown applied to commands that do not declare one of their own.
	 *
	 * @default no cooldown
	 */
	defaultCooldown?: CooldownOptions;

	/**
	 * Whether mentioning the bot is refused as a prefix.
	 *
	 * @default false
	 */
	disableMentionPrefix?: boolean;

	/**
	 * Guilds whose application commands may fail to be fetched without a warning being logged.
	 *
	 * Fetching a guild's commands fails when the bot was invited without the
	 * `applications.commands` scope, which normally produces a warning. Bot lists routinely invite
	 * bots without that scope on purpose, so their guilds produce a warning on every start-up that
	 * says nothing useful — list those guild IDs here to silence it.
	 *
	 * Set it to `true` to silence the warning for every guild instead.
	 */
	preventFailedToFetchLogForGuilds?: string[] | true;
}

/**
 * The client as a plugin hook sees it.
 *
 * Every hook is called with the client as `this`, and this is the type it is seen through: the whole
 * client, so a hook can register stores, attach listeners, read the logger or reach anything else it
 * needs. It exists as a separate name purely so the plugin types have somewhere to point that does
 * not read as an import of the client's implementation.
 *
 * @since 1.0.0
 */
export type KairoClientLike = KairoClient;
