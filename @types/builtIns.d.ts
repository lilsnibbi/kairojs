import type { ChannelType, PermissionsBitField } from "discord.js";
import type { ArgumentContext } from "./structures.d.ts";
import type {
	PreconditionContext,
	RunInPreconditionCommandSpecificData,
} from "./preconditions.d.ts";
import type { MessageResolverOptions } from "./resolvers.d.ts";

/**
 * The extra options the built-in `boolean` argument reads off its context.
 *
 * Whatever is listed here is checked *alongside* the spellings the parser already knows, never
 * instead of them, so adding a word can only widen what is accepted.
 *
 * @since 1.0.0
 */
export interface BooleanArgumentContext extends ArgumentContext<boolean> {
	/**
	 * Further words that should resolve to `true`, on top of `1`, `true`, `+`, `t`, `yes` and `y`.
	 */
	readonly truths?: readonly string[];

	/**
	 * Further words that should resolve to `false`, on top of `0`, `false`, `-`, `f`, `no` and `n`.
	 */
	readonly falses?: readonly string[];
}

/**
 * The extra options the built-in `enum` argument reads off its context.
 *
 * @since 1.0.0
 */
export interface EnumArgumentContext extends ArgumentContext<string> {
	/**
	 * Every value the parameter is allowed to be. Omitting it rejects everything, since nothing
	 * could match.
	 */
	readonly enum?: string[];

	/**
	 * Whether casing is ignored when comparing against the permitted values.
	 *
	 * @default false
	 */
	readonly caseInsensitive?: boolean;
}

/**
 * The extra options the built-in `member` argument reads off its context.
 *
 * @since 1.0.0
 */
export interface MemberArgumentContext extends ArgumentContext {
	/**
	 * Whether a parameter that is neither a mention nor an id may be searched for by name.
	 *
	 * The search costs a round trip to Discord and can land on somebody the caller did not mean, so
	 * turn it off where only an exact reference should be honoured.
	 *
	 * @default true
	 */
	readonly performFuzzySearch?: boolean;
}

/**
 * The extra options the built-in `message` argument reads off its context.
 *
 * The message or interaction the lookup is anchored to is supplied by the parser itself, which is
 * why it is the one field a caller cannot set.
 *
 * @since 1.0.0
 */
export type MessageArgumentContext = Omit<
	MessageResolverOptions,
	"messageOrInteraction"
> &
	ArgumentContext;

/**
 * The configuration the built-in `ClientPermissions` and `UserPermissions` preconditions read.
 *
 * @since 1.0.0
 */
export interface PermissionPreconditionContext extends PreconditionContext {
	/**
	 * The permissions that must be held for the command to be allowed through. An empty bitfield
	 * always passes.
	 */
	permissions?: PermissionsBitField;
}

/**
 * The configuration the built-in `RunIn` precondition reads.
 *
 * Leaving `types` out is what a command with no channel restriction produces, and it always passes.
 *
 * @since 1.0.0
 */
export interface RunInPreconditionContext extends PreconditionContext {
	/**
	 * The channel types the command may be invoked from — either one list covering every entry
	 * point, or a separate list per entry point.
	 */
	types?: readonly ChannelType[] | RunInPreconditionCommandSpecificData;
}
