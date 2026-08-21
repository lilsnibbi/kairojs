import type {
	APIApplicationCommandChoosableAndAutocompletableTypes,
	APIApplicationCommandMinAndMaxValueTypes,
	APIApplicationCommandMinMaxLengthTypes,
} from "@types";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type APIApplicationCommandChannelOption,
	type APIApplicationCommandOption,
} from "discord.js";

/**
 * Plain-English names for every option type, used when a difference has to be described to a human
 * rather than compared to another value.
 *
 * @since 1.0.0
 */
export const optionTypeToPrettyName = new Map<
	ApplicationCommandOptionType,
	string
>([
	[ApplicationCommandOptionType.Subcommand, "subcommand"],
	[ApplicationCommandOptionType.SubcommandGroup, "subcommand group"],
	[ApplicationCommandOptionType.String, "string option"],
	[ApplicationCommandOptionType.Integer, "integer option"],
	[ApplicationCommandOptionType.Boolean, "boolean option"],
	[ApplicationCommandOptionType.User, "user option"],
	[ApplicationCommandOptionType.Channel, "channel option"],
	[ApplicationCommandOptionType.Role, "role option"],
	[ApplicationCommandOptionType.Mentionable, "mentionable option"],
	[ApplicationCommandOptionType.Number, "number option"],
	[ApplicationCommandOptionType.Attachment, "attachment option"],
]);

/**
 * The command types that appear in a context menu rather than being typed out as a slash command.
 *
 * @since 1.0.0
 */
export const contextMenuTypes = [
	ApplicationCommandType.Message,
	ApplicationCommandType.User,
];

/**
 * The option types that stand for a subcommand rather than for a value the user supplies.
 *
 * @since 1.0.0
 */
export const subcommandTypes = [
	ApplicationCommandOptionType.SubcommandGroup,
	ApplicationCommandOptionType.Subcommand,
];

/**
 * Describes an option type for a difference report, falling back to a message that names the raw
 * numeric type when Discord has introduced one Kairo does not know about yet.
 *
 * @param type The option type to describe.
 *
 * @since 1.0.0
 */
export function describeOptionType(type: ApplicationCommandOptionType) {
	return (
		optionTypeToPrettyName.get(type) ??
		`unknown (${type}); please report this to the Kairo developers!`
	);
}

/**
 * Checks whether an option accepts `min_value` and `max_value`.
 *
 * @param option The option to check.
 *
 * @since 1.0.0
 */
export function hasMinMaxValueSupport(
	option: APIApplicationCommandOption,
): option is APIApplicationCommandMinAndMaxValueTypes {
	return [
		ApplicationCommandOptionType.Integer,
		ApplicationCommandOptionType.Number,
	].includes(option.type);
}

/**
 * Checks whether an option accepts preset choices and can opt into autocomplete.
 *
 * @param option The option to check.
 *
 * @since 1.0.0
 */
export function hasChoicesAndAutocompleteSupport(
	option: APIApplicationCommandOption,
): option is APIApplicationCommandChoosableAndAutocompletableTypes {
	return [
		ApplicationCommandOptionType.Integer, //
		ApplicationCommandOptionType.Number,
		ApplicationCommandOptionType.String,
	].includes(option.type);
}

/**
 * Checks whether an option accepts `min_length` and `max_length`.
 *
 * @param option The option to check.
 *
 * @since 1.0.0
 */
export function hasMinMaxLengthSupport(
	option: APIApplicationCommandOption,
): option is APIApplicationCommandMinMaxLengthTypes {
	return option.type === ApplicationCommandOptionType.String;
}

/**
 * Checks whether an option restricts which channel types may be picked.
 *
 * @param option The option to check.
 *
 * @since 1.0.0
 */
export function hasChannelTypesSupport(
	option: APIApplicationCommandOption,
): option is APIApplicationCommandChannelOption {
	return option.type === ApplicationCommandOptionType.Channel;
}
