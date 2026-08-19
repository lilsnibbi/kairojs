import type {
	APIApplicationCommandBasicOption,
	APIApplicationCommandChannelOption,
	APIApplicationCommandIntegerOption,
	APIApplicationCommandNumberOption,
	APIApplicationCommandOption,
	APIApplicationCommandStringOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	ApplicationCommandOptionType,
	ChatInputApplicationCommandData,
	ContextMenuCommandBuilder,
	LocalizationMap,
	MessageApplicationCommandData,
	RESTPostAPIApplicationCommandsJSONBody,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	RESTPostAPIContextMenuApplicationCommandsJSONBody,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
	UserApplicationCommandData,
} from "discord.js";
import type { ApplicationCommandRegistry } from "@/application-commands/registry.ts";
import type {
	InternalRegistryAPIType as InternalRegistryAPITypeConstant,
	RegisterBehavior as RegisterBehaviorConstant,
} from "@/constants/enums.ts";
import type { Command } from "@/structures/command.ts";
import type { RegisterBehavior } from "./constants.d.ts";

/* -------------------------------------------------------------------------- */
/*                                  Registry                                   */
/* -------------------------------------------------------------------------- */

/**
 * Everything a bot may hand to `ApplicationCommandRegistry#registerChatInputCommand`: a plain data
 * object, a ready-made builder, or a callback that configures a builder handed to it.
 *
 * @since 1.0.0
 */
export type RegisterableChatInputCommand =
	| ChatInputApplicationCommandData
	| SlashCommandBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| SlashCommandOptionsOnlyBuilder
	| Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
	| ((builder: SlashCommandBuilder) => unknown);

/**
 * Everything a bot may hand to `ApplicationCommandRegistry#registerContextMenuCommand`: a plain data
 * object, a ready-made builder, or a callback that configures a builder handed to it.
 *
 * @since 1.0.0
 */
export type RegisterableContextMenuCommand =
	| UserApplicationCommandData
	| MessageApplicationCommandData
	| ContextMenuCommandBuilder
	| ((builder: ContextMenuCommandBuilder) => unknown);

/**
 * Controls where a single application command is registered and what happens when the copy Discord
 * already has does not match the one the bot defines.
 *
 * @since 1.0.0
 */
export interface ApplicationCommandRegistryRegisterOptions {
	/**
	 * Register the command in these guilds only, instead of globally.
	 */
	guildIds?: string[];

	/**
	 * Whether to create the command when Discord does not have it yet.
	 *
	 * @defaultValue `true`
	 */
	registerCommandIfMissing?: boolean;

	/**
	 * What to do when Discord has the command but its data differs from the data given here.
	 *
	 * `BulkOverwrite` is deliberately not accepted: it is an application-wide strategy and can only
	 * be chosen through `setDefaultBehaviorWhenNotIdentical`.
	 *
	 * @defaultValue The value of `getDefaultBehaviorWhenNotIdentical()`.
	 */
	behaviorWhenNotIdentical?: Exclude<
		RegisterBehavior,
		(typeof RegisterBehaviorConstant)["BulkOverwrite"]
	>;

	/**
	 * Command ids to fall back on when no registered command carries the expected name, which is the
	 * only reliable way to track a command that has since been renamed.
	 *
	 * @defaultValue `[]`
	 */
	idHints?: string[];
}

/**
 * The registry's own view of {@link ApplicationCommandRegistryRegisterOptions}, which — unlike the
 * options a bot may pass — is allowed to carry the application-wide `BulkOverwrite` behaviour so the
 * default can be stamped onto every queued call.
 *
 * @internal
 * @since 1.0.0
 */
export type InternalRegisterOptions = Omit<
	ApplicationCommandRegistryRegisterOptions,
	"behaviorWhenNotIdentical"
> & {
	behaviorWhenNotIdentical?: RegisterBehavior;
};

/**
 * One registration queued on a registry, kept until the client is ready and the commands can be
 * reconciled against Discord.
 *
 * The `type` field discriminates the union, so narrowing it also narrows `builtData` to the matching
 * REST body.
 *
 * @internal
 * @since 1.0.0
 */
export type InternalAPICall =
	| {
			builtData: RESTPostAPIChatInputApplicationCommandsJSONBody;
			registerOptions: InternalRegisterOptions;
			type: (typeof InternalRegistryAPITypeConstant)["ChatInput"];
	  }
	| {
			builtData: RESTPostAPIContextMenuApplicationCommandsJSONBody;
			registerOptions: InternalRegisterOptions;
			type: (typeof InternalRegistryAPITypeConstant)["ContextMenu"];
	  };

/**
 * A command paired with the payload that will be sent for it during a bulk overwrite, so the command
 * can be found again once Discord replies with the ids it assigned.
 *
 * @internal
 * @since 1.0.0
 */
export interface BulkOverwriteData {
	/**
	 * The command the payload was built from.
	 */
	piece: Command;

	/**
	 * The payload as it will be sent to Discord.
	 */
	data: RESTPostAPIApplicationCommandsJSONBody;
}

/* -------------------------------------------------------------------------- */
/*                             Command differences                             */
/* -------------------------------------------------------------------------- */

/**
 * A single mismatch between the command Discord has registered and the command the bot defines.
 *
 * These are purely descriptive — they exist to be logged, and every field is already a string ready
 * to print.
 *
 * @since 1.0.0
 */
export interface CommandDifference {
	/**
	 * Where the mismatch is, written as a path into the command data, such as
	 * `options[0].choices[2].value`.
	 */
	key: string;

	/**
	 * The value the bot defines, as text.
	 */
	expected: string;

	/**
	 * The value Discord currently has, as text.
	 */
	original: string;
}

/**
 * Builds the reported path for the option at a given index.
 *
 * Nested options compose these: a subcommand's checker passes down a function that wraps the parent
 * path, so a deeply nested option still reports a path a reader can follow.
 *
 * @since 1.0.0
 */
export type CommandDifferenceKeyPath = (index: number) => string;

/* -------------------------------------------------------------------------- */
/*                          Narrowed API option types                          */
/* -------------------------------------------------------------------------- */

/**
 * The option types that hold further options of their own.
 *
 * @since 1.0.0
 */
export type APIApplicationCommandSubcommandTypes =
	| APIApplicationCommandSubcommandOption
	| APIApplicationCommandSubcommandGroupOption;

/**
 * The option types that accept `min_value` and `max_value`.
 *
 * @since 1.0.0
 */
export type APIApplicationCommandMinAndMaxValueTypes =
	| APIApplicationCommandIntegerOption
	| APIApplicationCommandNumberOption;

/**
 * The option types that accept preset choices and can opt into autocomplete.
 *
 * @since 1.0.0
 */
export type APIApplicationCommandChoosableAndAutocompletableTypes =
	| APIApplicationCommandMinAndMaxValueTypes
	| APIApplicationCommandStringOption;

/**
 * The option types that accept `min_length` and `max_length`.
 *
 * @since 1.0.0
 */
export type APIApplicationCommandMinMaxLengthTypes =
	APIApplicationCommandStringOption;

/**
 * Every channel type a channel option is allowed to restrict itself to.
 *
 * @since 1.0.0
 */
export type AllowedApplicationCommandChannelType = Exclude<
	APIApplicationCommandChannelOption["channel_types"],
	undefined
>[number];

/* -------------------------------------------------------------------------- */
/*                         Difference checker arguments                        */
/* -------------------------------------------------------------------------- */

/**
 * Arguments for the name comparison, shared by commands and by individual options.
 *
 * @since 1.0.0
 */
export interface NameDifferenceOptions {
	/**
	 * The name Discord currently has.
	 */
	oldName: string;

	/**
	 * The name the bot defines.
	 */
	newName: string;

	/**
	 * The path to report the mismatch under.
	 *
	 * @defaultValue `"name"`
	 */
	key?: string;
}

/**
 * Arguments for the description comparison, shared by commands and by individual options.
 *
 * @since 1.0.0
 */
export interface DescriptionDifferenceOptions {
	/**
	 * The description Discord currently has.
	 */
	oldDescription: string;

	/**
	 * The description the bot defines.
	 */
	newDescription: string;

	/**
	 * The path to report the mismatch under.
	 *
	 * @defaultValue `"description"`
	 */
	key?: string;
}

/**
 * Arguments for comparing one localization map against another.
 *
 * The same checker serves name and description maps, so the wording used in the reported difference
 * is supplied by the caller rather than hardcoded.
 *
 * @since 1.0.0
 */
export interface LocalizationDifferenceOptions {
	/**
	 * The path the map lives at, such as `nameLocalizations`.
	 */
	localeMapName: string;

	/**
	 * How to describe a map that has entries, such as `"localized names"`.
	 */
	localePresentMessage: string;

	/**
	 * How to describe a map that has no entries, such as `"no localized names"`.
	 */
	localeMissingMessage: string;

	/**
	 * The map Discord currently has.
	 */
	originalLocalizations?: LocalizationMap | null;

	/**
	 * The map the bot defines.
	 */
	expectedLocalizations?: LocalizationMap | null;
}

/**
 * Arguments for comparing the type of a single option.
 *
 * @since 1.0.0
 */
export interface OptionTypeDifferenceOptions {
	/**
	 * The path to report the mismatch under.
	 */
	key: string;

	/**
	 * The type Discord currently has.
	 */
	originalType: ApplicationCommandOptionType;

	/**
	 * The type the bot defines.
	 */
	expectedType: ApplicationCommandOptionType;
}

/**
 * Arguments for comparing whether an option is required.
 *
 * @since 1.0.0
 */
export interface OptionRequiredDifferenceOptions {
	/**
	 * Whether Discord currently has the option marked required. Absent counts as `false`.
	 */
	oldRequired?: boolean;

	/**
	 * Whether the bot defines the option as required. Absent counts as `false`.
	 */
	newRequired?: boolean;

	/**
	 * The path to report the mismatch under.
	 */
	key: string;
}

/**
 * Arguments shared by every checker that compares one option against its registered counterpart.
 *
 * @since 1.0.0
 */
export interface OptionDifferenceOptionsBase {
	/**
	 * The position of the option among its siblings.
	 */
	currentIndex: number;

	/**
	 * Builds the reported path for the option at a given index.
	 */
	keyPath: CommandDifferenceKeyPath;
}

/**
 * Arguments for comparing the autocomplete flag and the preset choices of an option.
 *
 * @since 1.0.0
 */
export interface OptionAutocompleteDifferenceOptions
	extends OptionDifferenceOptionsBase {
	/**
	 * The option the bot defines.
	 */
	expectedOption: APIApplicationCommandChoosableAndAutocompletableTypes;

	/**
	 * The option Discord currently has.
	 */
	existingOption: APIApplicationCommandChoosableAndAutocompletableTypes;
}

/**
 * Arguments for comparing the channel types a channel option accepts.
 *
 * @since 1.0.0
 */
export interface OptionChannelTypesDifferenceOptions
	extends OptionDifferenceOptionsBase {
	/**
	 * The channel types Discord currently has.
	 */
	existingChannelTypes?: APIApplicationCommandChannelOption["channel_types"];

	/**
	 * The channel types the bot defines.
	 */
	newChannelTypes?: APIApplicationCommandChannelOption["channel_types"];
}

/**
 * Arguments for comparing the length bounds of a string option.
 *
 * @since 1.0.0
 */
export interface OptionMinMaxLengthDifferenceOptions
	extends OptionDifferenceOptionsBase {
	/**
	 * The option the bot defines.
	 */
	expectedOption: APIApplicationCommandMinMaxLengthTypes;

	/**
	 * The option Discord currently has.
	 */
	existingOption: APIApplicationCommandMinMaxLengthTypes;
}

/**
 * Arguments for comparing the numeric bounds of an integer or number option.
 *
 * @since 1.0.0
 */
export interface OptionMinMaxValueDifferenceOptions
	extends OptionDifferenceOptionsBase {
	/**
	 * The option the bot defines.
	 */
	expectedOption: APIApplicationCommandMinAndMaxValueTypes;

	/**
	 * The option Discord currently has.
	 */
	existingOption: APIApplicationCommandMinAndMaxValueTypes;
}

/**
 * Arguments for comparing a single option — of any type, at any depth — against the one Discord has.
 *
 * @internal
 * @since 1.0.0
 */
export interface ReportOptionDifferencesOptions {
	/**
	 * The option the bot defines.
	 */
	option: APIApplicationCommandOption;

	/**
	 * The position of the option among its siblings.
	 */
	currentIndex: number;

	/**
	 * The option Discord currently has at the same position, if any.
	 */
	existingOption?: APIApplicationCommandOption;

	/**
	 * Builds the reported path for the option at a given index.
	 *
	 * @defaultValue A function producing `options[index]`.
	 */
	keyPath?: CommandDifferenceKeyPath;
}

/**
 * Arguments for comparing the options nested inside a subcommand.
 *
 * @internal
 * @since 1.0.0
 */
export interface SubcommandOptionsDifferenceOptions {
	/**
	 * The nested options the bot defines.
	 */
	expectedOptions?: APIApplicationCommandBasicOption[];

	/**
	 * The nested options Discord currently has.
	 */
	existingOptions?: APIApplicationCommandBasicOption[];

	/**
	 * The position of the owning subcommand among its siblings.
	 */
	currentIndex: number;

	/**
	 * Builds the reported path for the owning subcommand at a given index.
	 */
	keyPath: CommandDifferenceKeyPath;
}

export type { ApplicationCommandRegistry };
