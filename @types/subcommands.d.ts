import type { Message } from "discord.js";
import type {
	SubcommandCommandPreConditions as SubcommandCommandPreConditionsConstant,
	SubcommandIdentifiers as SubcommandIdentifiersConstant,
	SubcommandPluginEvents as SubcommandPluginEventsConstant,
	SubcommandPluginIdentifiers as SubcommandPluginIdentifiersConstant,
} from "@/constants/subcommands.ts";
import type { UserError } from "@/errors/user-error.ts";
import type { Args } from "@/parsers/args.ts";
import type { Command } from "@/structures/command.ts";
import type { Subcommand } from "@/structures/subcommand.ts";
import type { ChatInputCommandInteraction } from "discord.js";
import type {
	ChatInputCommandRunContext,
	CommandOptions,
	MessageCommandRunContext,
} from "./commands.d.ts";
import type { MessageCommandDeniedPayload } from "./events.d.ts";
import type { CooldownPreconditionContext } from "./preconditions.d.ts";
import type { BucketScope } from "./constants.d.ts";
import type { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";

/* -------------------------------------------------------------------------- */
/*                              Derived constants                              */
/* -------------------------------------------------------------------------- */

/**
 * The preconditions a subcommand mapping's own options are folded into.
 *
 * @since 1.0.0
 */
export type SubcommandCommandPreConditions =
	(typeof SubcommandCommandPreConditionsConstant)[keyof typeof SubcommandCommandPreConditionsConstant];

/**
 * The identifiers the subcommand preconditions attach to their errors.
 *
 * @since 1.0.0
 */
export type SubcommandIdentifiers =
	(typeof SubcommandIdentifiersConstant)[keyof typeof SubcommandIdentifiersConstant];

/**
 * Every event a subcommand emits while routing an invocation.
 *
 * @since 1.0.0
 */
export type SubcommandPluginEvents =
	(typeof SubcommandPluginEventsConstant)[keyof typeof SubcommandPluginEventsConstant];

/**
 * The identifiers the subcommand router attaches to its errors and no-match reports.
 *
 * @since 1.0.0
 */
export type SubcommandPluginIdentifiers =
	(typeof SubcommandPluginIdentifiersConstant)[keyof typeof SubcommandPluginIdentifiersConstant];

/* -------------------------------------------------------------------------- */
/*                            Subcommand mappings                              */
/* -------------------------------------------------------------------------- */

/**
 * One entry in a command's `subcommands` list: either a subcommand or a group of them.
 *
 * @since 1.0.0
 */
export type SubcommandMapping =
	| SubcommandMappingMethod
	| SubcommandMappingGroup;

/**
 * The whole `subcommands` list a command declares.
 *
 * @since 1.0.0
 */
export type SubcommandMappingArray = SubcommandMapping[];

/**
 * What every mapping entry has in common, whatever kind it is.
 *
 * @since 1.0.0
 */
export interface SubcommandMappingBase {
	/**
	 * The name of this subcommand or subcommand group, as the caller types it.
	 */
	name: string;

	/**
	 * Whether this entry describes a single subcommand or a group of them.
	 *
	 * @default "method"
	 */
	type?: "group" | "method";
}

/**
 * A single subcommand: the name the caller types, and where that name routes to.
 *
 * The precondition shortcuts are the same ones a command accepts, and they are resolved the same
 * way — but into a container of this subcommand's own, so `config set` can be admin-only while
 * `config show` is not.
 *
 * @since 1.0.0
 */
export interface SubcommandMappingMethod
	extends SubcommandMappingBase,
		Pick<
			CommandOptions,
			| "preconditions"
			// The rest are shortcuts that expand into preconditions.
			| "runIn"
			| "nsfw"
			| "cooldownLimit"
			| "cooldownDelay"
			| "cooldownScope"
			| "cooldownFilteredUsers"
			| "requiredClientPermissions"
			| "requiredUserPermissions"
		> {
	/**
	 * A single subcommand is always a `"method"`.
	 */
	type?: "method";

	/**
	 * Whether this subcommand runs when the caller named none.
	 *
	 * This only ever applies to message commands: Discord always supplies a subcommand name for a
	 * chat input command, so there is nothing to fall back to there.
	 */
	default?: boolean;

	/**
	 * What to run when this subcommand is reached through a **message command** — either the name of
	 * a method on the class, or the implementation inline.
	 *
	 * Naming a method as a string only compiles once that method exists on the class, which is what
	 * keeps the reference from silently rotting after a rename.
	 *
	 * @example
	 * ```typescript
	 * { name: "grant", messageRun: "runAdminConfig" }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * runAdminConfig(message: Message) {
	 *   return message.reply(`<@${message.author.id}> has been granted admin.`);
	 * }
	 * ```
	 */
	messageRun?: string | Command["messageRun"];

	/**
	 * What to run when this subcommand is reached through a **chat input command** — either the name
	 * of a method on the class, or the implementation inline.
	 *
	 * @example
	 * ```typescript
	 * { name: "grant", chatInputRun: "runModeratorConfig" }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * runModeratorConfig(interaction: ChatInputCommandInteraction) {
	 *   return interaction.reply(`<@${interaction.user.id}> has been granted moderator.`);
	 * }
	 * ```
	 */
	chatInputRun?: string | Command["chatInputRun"];
}

/**
 * A group of subcommands, reached by typing the group's name before the subcommand's.
 *
 * @since 1.0.0
 */
export interface SubcommandMappingGroup extends SubcommandMappingBase {
	/**
	 * A group is always a `"group"`.
	 */
	type: "group";

	/**
	 * The subcommands this group contains.
	 */
	entries: SubcommandMappingMethod[];
}

/**
 * A mapping known to carry a `messageRun`, which is what the message events hand to their handlers.
 *
 * @since 1.0.0
 */
export type MessageSubcommandMappingMethod = Omit<
	SubcommandMappingMethod,
	"messageRun"
> &
	Required<Pick<SubcommandMappingMethod, "messageRun">>;

/**
 * A mapping known to carry a `chatInputRun`, which is what the chat input events hand to their
 * handlers.
 *
 * @since 1.0.0
 */
export type ChatInputCommandSubcommandMappingMethod = Omit<
	SubcommandMappingMethod,
	"chatInputRun"
> &
	Required<Pick<SubcommandMappingMethod, "chatInputRun">>;

/* -------------------------------------------------------------------------- */
/*                                  Options                                    */
/* -------------------------------------------------------------------------- */

/**
 * The options a `Subcommand` is constructed with.
 *
 * @since 1.0.0
 */
export interface SubcommandOptions extends CommandOptions {
	/**
	 * The subcommands this command routes to.
	 */
	subcommands?: SubcommandMappingArray;

	/**
	 * Also accept each hyphenated subcommand name without its hyphens, so `set-prefix` answers to
	 * `setprefix` too.
	 *
	 * Only message subcommands are affected — a mapping with no `messageRun` is skipped, since a
	 * chat input subcommand's name is fixed by what was registered with Discord. Groups get the
	 * treatment on both the group name and the subcommands inside it.
	 *
	 * @default false
	 */
	generateDashLessAliases?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Event payloads                                 */
/* -------------------------------------------------------------------------- */

/**
 * What the message no-match event reports: the invocation's own context, plus whatever the caller
 * actually typed where a subcommand name was expected.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandNoMatchContext
	extends MessageCommandRunContext {
	command: Subcommand;
	identifier: typeof SubcommandPluginIdentifiersConstant.MessageSubcommandNoMatch;
	message: string;

	/**
	 * The second word the caller typed, which would have been the subcommand inside a group.
	 */
	possibleSubcommandName: string | null;

	/**
	 * The first word the caller typed, which would have been either a subcommand or a group.
	 */
	possibleSubcommandGroupOrName: string | null;
}

/**
 * What the chat input no-match event reports.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandNoMatchContext
	extends ChatInputCommandRunContext {
	command: Subcommand;
	identifier: typeof SubcommandPluginIdentifiersConstant.ChatInputSubcommandNoMatch;
	message: string;
}

/**
 * The smallest payload a message subcommand event carries.
 *
 * @since 1.0.0
 */
export interface IMessageSubcommandPayload {
	message: Message;
	command: Subcommand;
}

/**
 * What a message subcommand event carries once a mapping has been matched.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandAcceptedPayload
	extends IMessageSubcommandPayload {
	context: MessageCommandRunContext;

	/**
	 * The mapping the caller's input routed to.
	 */
	matchedSubcommandMapping: SubcommandMappingMethod;
}

/**
 * What the message denial event carries.
 *
 * The remaining parameters are best-effort: they are read back off the argument stream, so they are
 * absent when the stream had nothing left to give.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandDeniedPayload
	extends Omit<MessageCommandDeniedPayload, "parameters" | "command">,
		MessageSubcommandAcceptedPayload {
	parameters?: string;
}

/**
 * What the message run event carries.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandRunPayload
	extends MessageSubcommandAcceptedPayload {}

/**
 * What the message error event carries.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandErrorPayload
	extends MessageSubcommandRunPayload {}

/**
 * What the message success event carries.
 *
 * @since 1.0.0
 */
export interface MessageSubcommandSuccessPayload
	extends MessageSubcommandRunPayload {
	result: unknown;
}

/**
 * The smallest payload a chat input subcommand event carries.
 *
 * @since 1.0.0
 */
export interface IChatInputSubcommandPayload {
	interaction: ChatInputCommandInteraction;
	command: Subcommand;
}

/**
 * What a chat input subcommand event carries once a mapping has been matched.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandAcceptedPayload
	extends IChatInputSubcommandPayload {
	context: ChatInputCommandRunContext;

	/**
	 * The mapping the interaction routed to.
	 */
	matchedSubcommandMapping: SubcommandMappingMethod;
}

/**
 * What the chat input denial event carries.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandDeniedPayload
	extends ChatInputSubcommandAcceptedPayload {}

/**
 * What the chat input run event carries.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandRunPayload
	extends ChatInputSubcommandAcceptedPayload {}

/**
 * What the chat input error event carries.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandErrorPayload
	extends ChatInputSubcommandRunPayload {}

/**
 * What the chat input success event carries.
 *
 * @since 1.0.0
 */
export interface ChatInputSubcommandSuccessPayload
	extends ChatInputSubcommandRunPayload {
	result: unknown;
}

/* -------------------------------------------------------------------------- */
/*                          Cooldown precondition                              */
/* -------------------------------------------------------------------------- */

/**
 * The configuration the subcommand cooldown precondition reads.
 *
 * It is the command-level cooldown context plus the names that identify one subcommand, which is
 * what keeps each subcommand's bucket separate from its siblings'.
 *
 * @since 1.0.0
 */
export interface PluginSubcommandCooldownPreconditionContext
	extends CooldownPreconditionContext {
	/**
	 * The name of the subcommand the bucket belongs to.
	 */
	subcommandMethodName: string;

	/**
	 * The name of the group the subcommand sits in, if any.
	 */
	subcommandGroupName?: string;
}

/**
 * Everything {@link parseSubcommandConstructorPreConditionsCooldown} needs to decide whether a
 * subcommand gets a cooldown, and what that cooldown should be.
 *
 * @since 1.0.0
 */
export interface ParseSubcommandConstructorPreConditionsCooldownParameters<
	PreParseReturn extends Args = Args,
	Options extends SubcommandOptions = SubcommandOptions,
> {
	/**
	 * The command the subcommand belongs to, consulted for its name.
	 */
	subcommand: Subcommand<PreParseReturn, Options>;

	/**
	 * How many uses are allowed inside one window.
	 */
	cooldownLimit: number | undefined;

	/**
	 * How long that window lasts, in milliseconds.
	 */
	cooldownDelay: number | undefined;

	/**
	 * Who the bucket is shared between.
	 */
	cooldownScope: BucketScope | undefined;

	/**
	 * Ids exempt from the cooldown entirely.
	 */
	cooldownFilteredUsers: string[] | undefined;

	/**
	 * The name of the subcommand this cooldown is for.
	 */
	subcommandMethodName: string;

	/**
	 * The name of the group the subcommand sits in, if any.
	 */
	subcommandGroupName?: string;

	/**
	 * The subcommand's own precondition list to append to.
	 */
	preconditionContainerArray: PreconditionContainerArray;
}

/* -------------------------------------------------------------------------- */
/*                          Client augmentations                               */
/* -------------------------------------------------------------------------- */

declare module "discord.js" {
	interface ClientOptions {
		/**
		 * The cooldown applied to subcommands that do not declare one of their own.
		 *
		 * This is deliberately separate from `defaultCooldown`: a command-wide default that also
		 * applied per subcommand would charge a caller twice for one invocation.
		 *
		 * Name a subcommand in `filteredCommands` as `commandName.subcommandName`, or
		 * `commandName.groupName.subcommandName` when it sits in a group.
		 *
		 * @default no cooldown
		 */
		subcommandDefaultCooldown?: import("./client.d.ts").CooldownOptions;
	}

	interface ClientEvents {
		[SubcommandPluginEventsConstant.ChatInputSubcommandDenied]: [
			error: UserError,
			payload: ChatInputSubcommandDeniedPayload,
		];
		[SubcommandPluginEventsConstant.ChatInputSubcommandRun]: [
			interaction: ChatInputCommandInteraction,
			subcommand: ChatInputCommandSubcommandMappingMethod,
			payload: ChatInputSubcommandRunPayload,
		];
		[SubcommandPluginEventsConstant.ChatInputSubcommandSuccess]: [
			interaction: ChatInputCommandInteraction,
			subcommand: ChatInputCommandSubcommandMappingMethod,
			payload: ChatInputSubcommandSuccessPayload,
		];
		[SubcommandPluginEventsConstant.ChatInputSubcommandError]: [
			error: unknown,
			payload: ChatInputSubcommandErrorPayload,
		];
		[SubcommandPluginEventsConstant.ChatInputSubcommandNoMatch]: [
			interaction: ChatInputCommandInteraction,
			context: ChatInputSubcommandNoMatchContext,
		];

		[SubcommandPluginEventsConstant.MessageSubcommandDenied]: [
			error: UserError,
			payload: MessageSubcommandDeniedPayload,
		];
		[SubcommandPluginEventsConstant.MessageSubcommandRun]: [
			message: Message,
			subcommand: MessageSubcommandMappingMethod,
			payload: MessageSubcommandRunPayload,
		];
		[SubcommandPluginEventsConstant.MessageSubcommandSuccess]: [
			message: Message,
			subcommand: MessageSubcommandMappingMethod,
			payload: MessageSubcommandSuccessPayload,
		];
		[SubcommandPluginEventsConstant.MessageSubcommandError]: [
			error: unknown,
			payload: MessageSubcommandErrorPayload,
		];
		[SubcommandPluginEventsConstant.MessageSubcommandNoMatch]: [
			message: Message,
			args: Args,
			context: MessageSubcommandNoMatchContext,
		];

		[SubcommandPluginEventsConstant.SubcommandMappingIsMissingMessageCommandHandler]: [
			message: Message,
			subcommand: SubcommandMappingMethod,
			payload: MessageSubcommandAcceptedPayload,
		];
		[SubcommandPluginEventsConstant.SubcommandMappingIsMissingChatInputCommandHandler]: [
			interaction: ChatInputCommandInteraction,
			subcommand: SubcommandMappingMethod,
			payload: ChatInputSubcommandAcceptedPayload,
		];
	}
}
