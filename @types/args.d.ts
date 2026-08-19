import type {
	CategoryChannel,
	ChannelType,
	DMChannel,
	GuildMember,
	Message,
	NewsChannel,
	Role,
	StageChannel,
	TextChannel,
	ThreadChannel,
	User,
	VoiceChannel,
} from "discord.js";
import type { ArgumentError } from "@/errors/argument-error.ts";
import type { UserError } from "@/errors/user-error.ts";
import type { Option } from "@/utilities/result/lib/option.ts";
import type { Result } from "@/utilities/result/lib/result.ts";
import type { MessageCommand, MessageCommandRunContext } from "./commands.d.ts";
import type { EmojiObject } from "./resolvers.d.ts";
import type {
	ChannelTypes,
	GuildBasedChannelTypes,
} from "./utilities/discord.js-utilities.d.ts";

/**
 * The plain snapshot `Args` produces for `JSON.stringify`, and the payload attached as `context` to
 * every error it raises.
 *
 * @since 1.0.0
 */
export interface ArgsJson {
	/**
	 * The message the parameters were read from.
	 */
	message: Message<boolean>;

	/**
	 * The command the message invoked.
	 */
	command: MessageCommand;

	/**
	 * The prefix and alias this invocation was matched by.
	 */
	commandContext: MessageCommandRunContext;
}

/**
 * The map from an argument's name to the value that argument resolves to.
 *
 * This is the table every `Args` method is typed against: `args.pick("user")` is known to produce a
 * `User` purely because of the entry below. Adding an {@link Argument} of your own is therefore two
 * steps — write the piece, then add its name here through module augmentation so the parser knows
 * what it hands back.
 *
 * @example
 * ```typescript
 * declare module "kairojs" {
 *   interface ArgType {
 *     duration: number;
 *   }
 * }
 *
 * // Now typed as `number` everywhere:
 * const duration = await args.pick("duration");
 * ```
 *
 * @since 1.0.0
 */
export interface ArgType {
	boolean: boolean;
	channel: ChannelTypes;
	date: Date;
	dmChannel: DMChannel;
	emoji: EmojiObject;
	enum: string;
	float: number;
	guildCategoryChannel: CategoryChannel;
	guildChannel: GuildBasedChannelTypes;
	guildNewsChannel: NewsChannel;
	guildNewsThreadChannel: ThreadChannel & {
		type: ChannelType.AnnouncementThread;
		parent: NewsChannel | null;
	};
	guildPrivateThreadChannel: ThreadChannel & {
		type: ChannelType.PrivateThread;
		parent: TextChannel | null;
	};
	guildPublicThreadChannel: ThreadChannel & {
		type: ChannelType.PublicThread;
		parent: TextChannel | null;
	};
	guildStageVoiceChannel: StageChannel;
	guildTextChannel: TextChannel;
	guildThreadChannel: ThreadChannel;
	guildVoiceChannel: VoiceChannel;
	hyperlink: URL;
	integer: number;
	member: GuildMember;
	message: Message;
	number: number;
	role: Role;
	string: string;
	url: URL;
	user: User;
}

/**
 * The argument table `Args` is actually typed against.
 *
 * {@link ArgType} is an open extension point, so a consumer is free to empty it out. Were that to
 * happen, `keyof ArgType` would collapse to `never` and every parser method would reject every name
 * with an error that says nothing about the cause. This guard falls back to an open string-keyed
 * table in that case, so the failure surfaces as a plain `unknown` value rather than as a wall of
 * `never`.
 *
 * @since 1.0.0
 */
export type ResolvedArgType = keyof ArgType extends never
	? Record<string, unknown>
	: ArgType;

/**
 * The extra detail handed to an {@link Argument} for a single parse.
 *
 * `Args` fills in the message, the command and the argument itself, so only the tuning knobs below
 * — plus anything else your own arguments read — are worth passing at the call site.
 *
 * @since 1.0.0
 */
export interface ArgOptions extends Record<PropertyKey, unknown> {
	/**
	 * The smallest value the argument should accept, for the arguments that check a range.
	 */
	minimum?: number;

	/**
	 * The largest value the argument should accept, for the arguments that check a range.
	 */
	maximum?: number;

	/**
	 * Whether the bounds above are inclusive.
	 */
	inclusive?: boolean;
}

/**
 * The options accepted by the parser methods that consume more than one parameter.
 *
 * @since 1.0.0
 */
export interface RepeatArgOptions extends ArgOptions {
	/**
	 * How many times at most the argument may be parsed.
	 *
	 * @default Infinity
	 */
	times?: number;
}

/**
 * The transform handed to `Args.nextMaybe` and `Args.next`, mapping a raw parameter into a value or
 * reporting failure with `none`.
 *
 * @since 1.0.0
 */
export type ArgsNextCallback<T> = (value: string) => Option<T>;

/**
 * What a single-value parser method resolves to: the parsed value, or the reason it could not be
 * produced.
 *
 * @since 1.0.0
 */
export type ResultType<T> = Result<T, UserError | ArgumentError<T>>;

/**
 * What a repeating parser method resolves to: every parsed value, or the reason the first one could
 * not be produced.
 *
 * @since 1.0.0
 */
export type ArrayResultType<T> = Result<T[], UserError | ArgumentError<T>>;

/**
 * How a command recognises flags and options inside its parameters.
 *
 * Flags and options are position-independent: `!ban @user --silent` and `!ban --silent @user` read
 * the same, because whatever the strategy claims never reaches the ordered parameters.
 *
 * @since 1.0.0
 */
export interface FlagStrategyOptions {
	/**
	 * The flags this command accepts. Flags are key-only, such as `--silent`.
	 *
	 * Pass an array to allow exactly those names, `true` to accept every name, or `false` to accept
	 * none.
	 *
	 * @default []
	 */
	flags?: readonly string[] | boolean;

	/**
	 * The options this command accepts. Options are key/value pairs, such as `--reason=spam`.
	 *
	 * Pass an array to allow exactly those names, `true` to accept every name, or `false` to accept
	 * none.
	 *
	 * @default []
	 */
	options?: readonly string[] | boolean;

	/**
	 * The prefixes that mark a parameter as a flag or an option.
	 *
	 * @default ["--", "-", "—"]
	 */
	prefixes?: string[];

	/**
	 * The characters that separate an option's key from its value.
	 *
	 * @default ["=", ":"]
	 */
	separators?: string[];
}
