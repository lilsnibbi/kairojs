import type { ChannelType, PermissionResolvable, Snowflake } from "discord.js";
import type { Command } from "@/structures/command.ts";
import type { ApplicationCommandRegistry } from "@/applicationCommands/registry.ts";
import type { AliasPieceJSON, AliasPieceOptions } from "./loader.d.ts";
import type { BucketScope, CommandOptionsRunType } from "./constants.d.ts";
import type { FlagStrategyOptions } from "./args.d.ts";
import type { PreconditionEntryResolvable } from "./preconditions.d.ts";
import type { Nullish } from "./utilities/common.d.ts";

/**
 * A command's long-form description: either prose, or a structured object a bot defines for itself.
 *
 * @since 1.0.0
 */
export type DetailedDescriptionCommand =
	| string
	| DetailedDescriptionCommandObject;

/**
 * A structured long-form description.
 *
 * This interface is deliberately empty. Augment it to give your bot's help command a richer shape
 * than a plain string — usage examples, argument tables, and so on.
 *
 * @since 1.0.0
 */
// biome-ignore lint/complexity/noBannedTypes: the empty object is deliberate — consumers augment this type
export type DetailedDescriptionCommandObject = {};

/**
 * Everything accepted for a command's `runIn`, in any of the spellings it allows: a discord.js
 * channel type, one of the friendly string names, or an array mixing them.
 *
 * @since 1.0.0
 */
export type CommandRunInUnion =
	| ChannelType
	| CommandOptionsRunType
	| readonly (ChannelType | CommandOptionsRunType)[]
	| Nullish;

/**
 * A `runIn` that names each entry point separately, for when a command should be allowed in
 * different places depending on how it was invoked.
 *
 * @since 1.0.0
 */
export interface CommandSpecificRunIn {
	chatInputRun?: CommandRunInUnion;
	messageRun?: CommandRunInUnion;
	contextMenuRun?: CommandRunInUnion;
}

/**
 * The options a `Command` is constructed with.
 *
 * @since 1.0.0
 */
export interface CommandOptions extends AliasPieceOptions, FlagStrategyOptions {
	/**
	 * Also register each hyphenated name and alias without its hyphens, so `my-command` answers to
	 * `mycommand` too.
	 *
	 * @default false
	 */
	generateDashLessAliases?: boolean;

	/**
	 * Also register each underscored name and alias without its underscores, so `my_command` answers
	 * to `mycommand` too.
	 *
	 * @default false
	 */
	generateUnderscoreLessAliases?: boolean;

	/**
	 * A one-line summary of what the command does.
	 *
	 * @default ""
	 */
	description?: string;

	/**
	 * A longer explanation of the command and how to use it.
	 *
	 * @default ""
	 */
	detailedDescription?: DetailedDescriptionCommand;

	/**
	 * The folders this command should report as its category, overriding the path it was loaded from.
	 *
	 * @default the command's folders relative to the commands directory
	 *
	 * @example
	 * ```typescript
	 * // commands/general/ping.ts
	 * ["general"]
	 *
	 * // commands/general/about/info.ts
	 * ["general", "about"]
	 * ```
	 */
	fullCategory?: string[];

	/**
	 * The preconditions that must pass before the command runs, by name.
	 *
	 * @default []
	 */
	preconditions?: readonly PreconditionEntryResolvable[];

	/**
	 * The quote pairs the argument lexer should honour. Pass `[]` to disable quoting entirely.
	 *
	 * @default
	 * ```typescript
	 * [
	 *   ['"', '"'], // Straight double quotes
	 *   ["“", "”"], // Curly quotes, which iOS substitutes automatically
	 *   ["「", "」"], // Corner brackets, common in CJK input
	 *   ["«", "»"] // Guillemets, common in French input
	 * ]
	 * ```
	 */
	quotes?: [string, string][];

	/**
	 * Whether the command is NSFW. Setting this adds the `NSFW` precondition automatically.
	 *
	 * @default false
	 */
	nsfw?: boolean;

	/**
	 * How many uses fit in a cooldown bucket before it is exhausted. Adds the `Cooldown` precondition
	 * when paired with a non-zero `cooldownDelay`.
	 *
	 * @default 1
	 */
	cooldownLimit?: number;

	/**
	 * How long, in milliseconds, before a cooldown bucket resets. Adds the `Cooldown` precondition
	 * when paired with a non-zero `cooldownLimit`.
	 *
	 * @default 0
	 */
	cooldownDelay?: number;

	/**
	 * What the cooldown is counted against.
	 *
	 * @default BucketScope.User
	 */
	cooldownScope?: BucketScope;

	/**
	 * Users the cooldown never applies to — bot owners, for instance.
	 *
	 * @default undefined
	 */
	cooldownFilteredUsers?: Snowflake[];

	/**
	 * Permissions the bot itself must hold for the command to run.
	 *
	 * @default 0
	 */
	requiredClientPermissions?: PermissionResolvable;

	/**
	 * Permissions the caller must hold for the command to run.
	 *
	 * @default 0
	 */
	requiredUserPermissions?: PermissionResolvable;

	/**
	 * Where the command may run. `null` adds no restriction at all.
	 *
	 * Arrays are collapsed where possible so fewer checks run: a set covering every channel type
	 * becomes no restriction, since a check that can never fail is wasted work.
	 *
	 * Give a {@link CommandRunInUnion} to apply one rule to every entry point, or a
	 * {@link CommandSpecificRunIn} to give each entry point its own.
	 *
	 * @default null
	 */
	runIn?: CommandRunInUnion | CommandSpecificRunIn;

	/**
	 * Overrides the client's global typing setting for this command. Has no effect when the client
	 * has typing disabled.
	 *
	 * @default true
	 */
	typing?: boolean;
}

/**
 * What a message command's handler receives alongside its arguments.
 *
 * @since 1.0.0
 */
export interface MessageCommandRunContext extends Record<PropertyKey, unknown> {
	/**
	 * The prefix that matched: a string for the default and mention prefixes, a `RegExp` when the
	 * command was matched by `regexPrefix`.
	 */
	prefix: string | RegExp;

	/**
	 * The name or alias the caller actually typed.
	 */
	commandName: string;

	/**
	 * The prefix text as it appeared in the message. Identical to `prefix` when that was a string;
	 * for a `RegExp`, the substring it matched.
	 */
	commandPrefix: string;
}

/**
 * What a slash command's handler receives.
 *
 * @since 1.0.0
 */
export interface ChatInputCommandRunContext
	extends Record<PropertyKey, unknown> {
	commandName: string;
	commandId: string;
}

/**
 * What a context-menu command's handler receives.
 *
 * @since 1.0.0
 */
export interface ContextMenuCommandRunContext
	extends Record<PropertyKey, unknown> {
	commandName: string;
	commandId: string;
}

/**
 * What an autocomplete handler receives.
 *
 * @since 1.0.0
 */
export interface AutocompleteCommandRunContext
	extends Record<PropertyKey, unknown> {
	commandName: string;
	commandId: string;
}

/**
 * The shape produced by `Command#toJSON`.
 *
 * @since 1.0.0
 */
export interface CommandJSON extends AliasPieceJSON {
	description: string;
	detailedDescription: DetailedDescriptionCommand;
	category: string | null;
}

/**
 * A command narrowed to one that definitely handles prefixed messages.
 *
 * These four narrowings are what the `supports*` type guards on `Command` produce, so a handler is
 * known to exist after the guard rather than being optional.
 *
 * @since 1.0.0
 */
export type MessageCommand = Command & Required<Pick<Command, "messageRun">>;

/**
 * A command narrowed to one that definitely handles slash commands.
 *
 * @since 1.0.0
 */
export type ChatInputCommand = Command &
	Required<Pick<Command, "chatInputRun">>;

/**
 * A command narrowed to one that definitely handles context-menu entries.
 *
 * @since 1.0.0
 */
export type ContextMenuCommand = Command &
	Required<Pick<Command, "contextMenuRun">>;

/**
 * A command narrowed to one that definitely supplies autocomplete suggestions.
 *
 * @since 1.0.0
 */
export type AutocompleteCommand = Command &
	Required<Pick<Command, "autocompleteRun">>;

/**
 * A command's application-command registry.
 *
 * @since 1.0.0
 */
export type CommandRegistry = ApplicationCommandRegistry;
