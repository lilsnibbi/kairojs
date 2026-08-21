import type {
	ChannelType,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
	PermissionsBitField,
	Snowflake,
} from "discord.js";
import type {
	PreconditionRunCondition as PreconditionRunConditionConstant,
	PreconditionRunMode as PreconditionRunModeConstant,
} from "@/preconditions/containers/containerArray.ts";
import type { UserError } from "@/errors/userError.ts";
import type { Command } from "@/structures/command.ts";
import type { Result } from "@/utilities/result/lib/result.ts";
import type { BucketScope } from "./constants.d.ts";
import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
} from "./commands.d.ts";
import type { PluginSubcommandCooldownPreconditionContext } from "./subcommands.d.ts";
import type { Awaitable } from "./utilities/common.d.ts";

/**
 * The verdict a precondition container reaches: `ok` to let the command through, or an error
 * explaining the refusal.
 *
 * @since 1.0.0
 */
export type PreconditionContainerResult = Result<unknown, UserError>;

/**
 * What running a precondition container gives back — a verdict, or a promise of one.
 *
 * @since 1.0.0
 */
export type PreconditionContainerReturn =
	Awaitable<PreconditionContainerResult>;

/**
 * The always-asynchronous form of {@link PreconditionContainerReturn}, for implementations whose run
 * methods are declared `async`.
 *
 * @since 1.0.0
 */
export type AsyncPreconditionContainerReturn =
	Promise<PreconditionContainerResult>;

/**
 * The extra detail a precondition receives on top of the command and the thing that invoked it.
 *
 * The index signature is what lets a precondition define its own configuration — a cooldown reads
 * `delay` and `limit` off here, for example — while `external` is understood framework-wide.
 *
 * @since 1.0.0
 */
export interface PreconditionContext extends Record<PropertyKey, unknown> {
	/**
	 * Whether the precondition is being run on behalf of something other than the command's own
	 * list, such as a help command checking whether a command would be allowed.
	 */
	external?: boolean;
}

/**
 * One node in a command's precondition tree.
 *
 * Both a single named precondition and a whole nested array of them satisfy this, which is what
 * makes the tree uniform: a container never needs to know whether its children are leaves.
 *
 * @since 1.0.0
 */
export interface PreconditionContainer {
	/**
	 * Runs the container against a message command.
	 *
	 * @param message The message that triggered the command.
	 * @param command The command the message invoked.
	 * @param context The context to hand to the preconditions underneath.
	 */
	messageRun(
		message: Message,
		command: Command,
		context?: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Runs the container against a chat input command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context The context to hand to the preconditions underneath.
	 */
	chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: Command,
		context?: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Runs the container against a context menu command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context The context to hand to the preconditions underneath.
	 */
	contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: Command,
		context?: PreconditionContext,
	): PreconditionContainerReturn;
}

/**
 * The boolean operator an array container applies to its children.
 *
 * Implement this to teach the tree an operator it does not ship with, then register it on
 * `PreconditionContainerArray.conditions`. Each entry point comes in two flavours, one per
 * {@link PreconditionRunMode}.
 *
 * @since 1.0.0
 */
export interface PreconditionCondition {
	/**
	 * Runs the children one at a time, stopping as soon as the operator knows its answer.
	 *
	 * @param message The message that triggered the command.
	 * @param command The command the message invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	messageSequential(
		message: Message,
		command: MessageCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Starts every child at once and applies the operator to the settled results.
	 *
	 * @param message The message that triggered the command.
	 * @param command The command the message invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	messageParallel(
		message: Message,
		command: MessageCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Runs the children one at a time, stopping as soon as the operator knows its answer.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	chatInputSequential(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Starts every child at once and applies the operator to the settled results.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	chatInputParallel(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Runs the children one at a time, stopping as soon as the operator knows its answer.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	contextMenuSequential(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;

	/**
	 * Starts every child at once and applies the operator to the settled results.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param entries The children to run.
	 * @param context The context to hand to each child.
	 */
	contextMenuParallel(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		entries: readonly PreconditionContainer[],
		context: PreconditionContext,
	): PreconditionContainerReturn;
}

/**
 * Whether an array container walks its children one by one or starts them all at once.
 *
 * @since 1.0.0
 */
export type PreconditionRunMode =
	(typeof PreconditionRunModeConstant)[keyof typeof PreconditionRunModeConstant];

/**
 * The boolean operator an array container applies to its children.
 *
 * @since 1.0.0
 */
export type PreconditionRunCondition =
	(typeof PreconditionRunConditionConstant)[keyof typeof PreconditionRunConditionConstant];

/**
 * The long form of an array entry, used when the run mode has to be stated rather than inherited.
 *
 * @since 1.0.0
 */
export interface PreconditionArrayResolvableDetails {
	/**
	 * The children this container holds.
	 */
	entries: readonly PreconditionEntryResolvable[];

	/**
	 * Whether the children run one by one or all at once.
	 */
	mode: PreconditionRunMode;
}

/**
 * Everything an array container accepts: a bare list of children, or the long form that also states
 * the run mode.
 *
 * @since 1.0.0
 */
export type PreconditionArrayResolvable =
	| readonly PreconditionEntryResolvable[]
	| PreconditionArrayResolvableDetails;

/**
 * Everything a single slot in a precondition array accepts — one precondition, or a nested array of
 * them that flips the operator.
 *
 * @since 1.0.0
 */
export type PreconditionEntryResolvable =
	| PreconditionSingleResolvable
	| PreconditionArrayResolvable;

/**
 * The object form of a precondition that reads no context, where only its name is given.
 *
 * @since 1.0.0
 */
export interface SimplePreconditionSingleResolvableDetails {
	/**
	 * The name of the precondition to look up in the preconditions store.
	 */
	name: SimplePreconditionKeys;
}

/**
 * The object form of a precondition that reads context, where the context is given alongside the
 * name and is typed by whatever {@link Preconditions} declares for it.
 *
 * @since 1.0.0
 */
export interface PreconditionSingleResolvableDetails<
	K extends PreconditionKeys = PreconditionKeys,
> {
	/**
	 * The name of the precondition to look up in the preconditions store.
	 */
	name: K;

	/**
	 * The configuration this precondition reads.
	 */
	context: ResolvedPreconditions[K];
}

/**
 * Everything a single precondition slot accepts: a bare name, or one of the object forms.
 *
 * @since 1.0.0
 */
export type PreconditionSingleResolvable =
	| SimplePreconditionKeys
	| SimplePreconditionSingleResolvableDetails
	| PreconditionSingleResolvableDetails;

/**
 * How a `RunIn` precondition is configured when each entry point needs its own list of channel
 * types.
 *
 * @since 1.0.0
 */
export interface RunInPreconditionCommandSpecificData {
	/**
	 * The channel types the command may be invoked from as a message command.
	 */
	messageRun: readonly ChannelType[];

	/**
	 * The channel types the command may be invoked from as a chat input command.
	 */
	chatInputRun: readonly ChannelType[];

	/**
	 * The channel types the command may be invoked from as a context menu command.
	 */
	contextMenuRun: readonly ChannelType[];
}

/**
 * How the built-in `Cooldown` precondition is configured.
 *
 * @since 1.0.0
 */
export interface CooldownPreconditionContext extends PreconditionContext {
	/**
	 * How widely a single bucket is shared.
	 *
	 * @default BucketScope.User
	 */
	scope?: BucketScope;

	/**
	 * How long, in milliseconds, a bucket takes to refill.
	 */
	delay: number;

	/**
	 * How many invocations fit in a bucket before it is spent.
	 *
	 * @default 1
	 */
	limit?: number;

	/**
	 * The users this cooldown never applies to, such as the bot's owners.
	 */
	filteredUsers?: Snowflake[];
}

/**
 * Every precondition that can be named in a command's `preconditions` list, mapped to the context
 * it reads.
 *
 * A `never` value means the precondition takes no configuration, which is what makes the bare-string
 * form (`preconditions: ["NSFW"]`) legal for it. Anything else makes the context mandatory, so the
 * name has to be written in object form with a matching `context`.
 *
 * Register your own preconditions here through module augmentation.
 *
 * @example
 * ```typescript
 * declare module "kairojs" {
 *   interface Preconditions {
 *     // Takes no configuration:
 *     Moderator: never;
 *
 *     // Takes configuration:
 *     ChannelPermissions: { permissions: PermissionsBitField };
 *   }
 * }
 *
 * // Accepted:
 * preconditions.append("Moderator");
 * preconditions.append({ name: "Moderator" });
 * preconditions.append({ name: "ChannelPermissions", context: { permissions: new PermissionsBitField(8n) } });
 *
 * // Rejected — a `never` entry takes no context:
 * preconditions.append({ name: "Moderator", context: {} });
 *
 * // Rejected — a configured entry cannot be named as a bare string:
 * preconditions.append("ChannelPermissions");
 *
 * // Rejected — the context does not match what was declared:
 * preconditions.append({ name: "ChannelPermissions", context: { unknownProperty: 1 } });
 * ```
 *
 * @since 1.0.0
 */
export interface Preconditions {
	ClientPermissions: {
		permissions: PermissionsBitField;
	};
	Cooldown: CooldownPreconditionContext;
	Enabled: never;
	NSFW: never;
	PluginSubcommandCooldown: PluginSubcommandCooldownPreconditionContext;
	RunIn: {
		types: readonly ChannelType[] | RunInPreconditionCommandSpecificData;
	};
	UserPermissions: {
		permissions: PermissionsBitField;
	};
}

/**
 * The precondition table the containers are actually typed against.
 *
 * {@link Preconditions} is an open extension point, so a consumer is free to empty it out. Were that
 * to happen, every name in a `preconditions` list would be rejected against `never` with an error
 * that says nothing about the cause. This guard falls back to an open, context-free table in that
 * case, so bare names keep working instead.
 *
 * @since 1.0.0
 */
export type ResolvedPreconditions = keyof Preconditions extends never
	? Record<string, never>
	: Preconditions;

/**
 * Every precondition name that may be used in a command's list.
 *
 * @since 1.0.0
 */
export type PreconditionKeys = keyof ResolvedPreconditions;

/**
 * Every precondition name that reads no context, and may therefore be written as a bare string.
 *
 * @since 1.0.0
 */
export type SimplePreconditionKeys = {
	[K in PreconditionKeys]: ResolvedPreconditions[K] extends never ? K : never;
}[PreconditionKeys];
