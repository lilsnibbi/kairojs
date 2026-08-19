import type {
	RegisterableChatInputCommand,
	RegisterableContextMenuCommand,
} from "@types";
import { isFunction } from "@utilities/utilities/index.ts";
import {
	ApplicationCommand,
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	PermissionsBitField,
	SlashCommandBuilder,
	type APIApplicationCommandOption,
	type ApplicationCommandOptionData,
	type ApplicationIntegrationType,
	type InteractionContextType,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
	type SlashCommandOptionsOnlyBuilder,
	type SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

/**
 * Checks whether the value is a slash command builder rather than a plain data object.
 *
 * The narrower builder shapes are all the same class at runtime — the distinct types only exist to
 * stop a caller from adding a subcommand to a builder that already has plain options — so one
 * `instanceof` covers every one of them.
 *
 * @param command The value to check.
 */
function isBuilder(
	command: unknown,
): command is
	| SlashCommandBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| SlashCommandOptionsOnlyBuilder
	| Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> {
	return command instanceof SlashCommandBuilder;
}

/**
 * Fills in the fields Discord would default for us on a chat input payload.
 *
 * The comparison against a registered command is a field-by-field one, so a payload that leaves
 * these out would look different from the command Discord echoes back with them filled in, and the
 * command would be re-registered on every single start-up.
 *
 * @param data The payload to complete, modified in place.
 */
function addDefaultsToChatInputJSON(
	data: RESTPostAPIChatInputApplicationCommandsJSONBody,
): RESTPostAPIChatInputApplicationCommandsJSONBody {
	data.dm_permission ??= true;
	data.type ??= ApplicationCommandType.ChatInput;
	data.default_member_permissions ??= null;

	return data;
}

/**
 * Fills in the fields Discord would default for us on a context menu payload, for the same reason
 * {@link addDefaultsToChatInputJSON} does.
 *
 * @param data The payload to complete, modified in place.
 */
function addDefaultsToContextMenuJSON(
	data: RESTPostAPIContextMenuApplicationCommandsJSONBody,
): RESTPostAPIContextMenuApplicationCommandsJSONBody {
	data.dm_permission ??= true;
	data.default_member_permissions ??= null;

	return data;
}

/**
 * Turns any of the accepted ways of describing a chat input command into the REST payload Discord
 * expects.
 *
 * @param command A data object, a builder, or a callback handed a fresh builder to configure.
 *
 * @since 1.0.0
 */
export function normalizeChatInputCommand(
	command: RegisterableChatInputCommand,
): RESTPostAPIChatInputApplicationCommandsJSONBody {
	if (isFunction(command)) {
		const builder = new SlashCommandBuilder();
		command(builder);
		return addDefaultsToChatInputJSON(
			builder.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody,
		);
	}

	if (isBuilder(command)) {
		return addDefaultsToChatInputJSON(
			command.toJSON() as RESTPostAPIChatInputApplicationCommandsJSONBody,
		);
	}

	const payload: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: command.name,
		name_localizations: command.nameLocalizations,
		description: command.description,
		description_localizations: command.descriptionLocalizations,
		type: ApplicationCommandType.ChatInput,
		dm_permission: command.dmPermission,
		nsfw: command.nsfw,
		integration_types: command.integrationTypes as
			| ApplicationIntegrationType[]
			| undefined,
		contexts: command.contexts as InteractionContextType[] | undefined,
	};

	// Left absent rather than nulled when the caller never mentioned it, so the defaults pass below
	// can tell "unset" apart from "deliberately unrestricted".
	if (typeof command.defaultMemberPermissions !== "undefined") {
		payload.default_member_permissions =
			command.defaultMemberPermissions === null
				? null
				: new PermissionsBitField(
						command.defaultMemberPermissions,
					).bitfield.toString();
	}

	if (command.options?.length) {
		payload.options = command.options.map(transformOption);
	}

	return addDefaultsToChatInputJSON(payload);
}

/**
 * Turns any of the accepted ways of describing a context menu command into the REST payload Discord
 * expects.
 *
 * @param command A data object, a builder, or a callback handed a fresh builder to configure.
 *
 * @since 1.0.0
 */
export function normalizeContextMenuCommand(
	command: RegisterableContextMenuCommand,
): RESTPostAPIContextMenuApplicationCommandsJSONBody {
	if (isFunction(command)) {
		const builder = new ContextMenuCommandBuilder();
		command(builder);
		return addDefaultsToContextMenuJSON(
			builder.toJSON() as RESTPostAPIContextMenuApplicationCommandsJSONBody,
		);
	}

	if (command instanceof ContextMenuCommandBuilder) {
		return addDefaultsToContextMenuJSON(
			command.toJSON() as RESTPostAPIContextMenuApplicationCommandsJSONBody,
		);
	}

	const payload: RESTPostAPIContextMenuApplicationCommandsJSONBody = {
		name: command.name,
		name_localizations: command.nameLocalizations,
		type: command.type,
		dm_permission: command.dmPermission,
		nsfw: command.nsfw,
		integration_types: command.integrationTypes as
			| ApplicationIntegrationType[]
			| undefined,
		contexts: command.contexts as InteractionContextType[] | undefined,
	};

	if (typeof command.defaultMemberPermissions !== "undefined") {
		payload.default_member_permissions =
			command.defaultMemberPermissions === null
				? null
				: new PermissionsBitField(
						command.defaultMemberPermissions,
					).bitfield.toString();
	}

	return addDefaultsToContextMenuJSON(payload);
}

/**
 * Rebuilds the REST payload for a command Discord already has, so it can be compared field by field
 * against the payload the bot defines.
 *
 * @param command The registered command to convert.
 * @throws When the command is of a type Kairo cannot register, which should be unreachable.
 *
 * @since 1.0.0
 */
export function convertApplicationCommandToApiData(
	command: ApplicationCommand,
): RESTPostAPIApplicationCommandsJSONBody {
	const payload = {
		name: command.name,
		name_localizations: command.nameLocalizations,
		dm_permission: command.dmPermission,
		nsfw: command.nsfw,
		default_member_permissions:
			command.defaultMemberPermissions?.bitfield.toString() ?? null,
		integration_types: command.integrationTypes,
		contexts: command.contexts,
	} as RESTPostAPIApplicationCommandsJSONBody;

	if (command.type === ApplicationCommandType.ChatInput) {
		const chatInputPayload =
			payload as RESTPostAPIChatInputApplicationCommandsJSONBody;

		chatInputPayload.type = ApplicationCommandType.ChatInput;
		chatInputPayload.description = command.description;
		chatInputPayload.description_localizations =
			command.descriptionLocalizations;
	} else if (command.type === ApplicationCommandType.Message) {
		payload.type = ApplicationCommandType.Message;
	} else if (command.type === ApplicationCommandType.User) {
		payload.type = ApplicationCommandType.User;
	} else {
		throw new Error(`Unknown command type received: ${command.type}`);
	}

	if (command.options.length) {
		payload.options = command.options.map((option) =>
			transformOption(option as ApplicationCommandOptionData),
		);
	}

	return payload;
}

/**
 * Converts one option from the camelCase shape discord.js accepts into the snake_case shape the API
 * uses.
 *
 * discord.js keeps this conversion to itself, but the registries need exactly the same result to
 * compare payloads, and reimplementing it would drift the moment Discord adds a field.
 *
 * @param option The option to convert.
 */
function transformOption(option: ApplicationCommandOptionData) {
	return ApplicationCommand.transformOption(
		option,
	) as APIApplicationCommandOption;
}
