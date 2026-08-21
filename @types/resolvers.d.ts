import type { Message } from "discord.js";
import type {
	AnyInteraction,
	TextBasedChannelTypes,
} from "./utilities/discordjs.d.ts";

/**
 * The lower and upper bound a resolver accepts, shared by every resolver that validates a range.
 *
 * What the two numbers measure depends on the resolver: a timestamp for dates, the parsed value
 * itself for the numeric resolvers, and a character count for strings. In all cases both ends are
 * inclusive, and leaving one out means that side is unbounded.
 *
 * @since 1.0.0
 */
export interface ResolverBoundsOptions {
	/**
	 * The smallest value that is still accepted.
	 */
	minimum?: number;

	/**
	 * The largest value that is still accepted.
	 */
	maximum?: number;
}

/**
 * Extra spellings the boolean resolver should recognise, on top of the ones it already knows.
 *
 * Entries are compared against the lower-cased parameter, so they should be written in lower case.
 *
 * @since 1.0.0
 */
export interface BooleanResolverOptions {
	/**
	 * Additional words that resolve to `true`.
	 */
	truths?: readonly string[];

	/**
	 * Additional words that resolve to `false`.
	 */
	falses?: readonly string[];
}

/**
 * The set of permitted values the enum resolver matches a parameter against.
 *
 * @since 1.0.0
 */
export interface EnumResolverOptions {
	/**
	 * Every value considered valid. An empty or missing list is itself an error, since nothing
	 * could ever match.
	 */
	enum?: string[];

	/**
	 * Whether casing is ignored when comparing.
	 *
	 * @default false
	 */
	caseInsensitive?: boolean;
}

/**
 * A resolved emoji, reduced to the three fields that identify it.
 *
 * Unicode emoji carry their literal characters in `name` and have no `id`; custom emoji carry the
 * name they were uploaded with plus the snowflake Discord assigned them.
 *
 * @since 1.0.0
 */
export interface EmojiObject {
	/**
	 * The emoji's name, or the raw unicode sequence for a standard emoji.
	 */
	name: string | null;

	/**
	 * The snowflake of a custom emoji, or `null` for a standard one.
	 */
	id: string | null;

	/**
	 * Whether the custom emoji is animated.
	 */
	animated?: boolean;
}

/**
 * The context the message resolver needs in order to turn a parameter into a message.
 *
 * @since 1.0.0
 */
export interface MessageResolverOptions {
	/**
	 * The channel to look the message up in.
	 *
	 * @default the channel the base message or interaction came from
	 */
	channel?: TextBasedChannelTypes;

	/**
	 * The message or interaction the lookup is anchored to. It supplies the fallback channel, the
	 * guild a message link has to belong to, and the user whose view permissions are checked.
	 */
	messageOrInteraction: Message | AnyInteraction;

	/**
	 * Whether a bare snowflake may be searched for across every cached channel in the guild.
	 * Ignored when `channel` is given.
	 *
	 * @default false
	 */
	scan?: boolean;
}
