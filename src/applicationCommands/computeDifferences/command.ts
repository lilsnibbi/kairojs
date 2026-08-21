import type { CommandDifference, InternalAPICall } from "@types";
import {
	ApplicationCommandType,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord.js";
import { checkInteractionContextTypes } from "./contexts.ts";
import { checkDefaultMemberPermissions } from "./defaultMemberPermissions.ts";
import { checkDescription } from "./description.ts";
import { checkDMPermission } from "./dmPermission.ts";
import { checkIntegrationTypes } from "./integrationTypes.ts";
import { checkLocalizations } from "./localizations.ts";
import { checkName } from "./name.ts";
import { checkOptions } from "./options.ts";
import { contextMenuTypes } from "./shared.ts";

/**
 * Answers the only question the registry usually cares about: does the registered command differ
 * from the one the bot defines?
 *
 * Nothing is described and nothing is collected — the very first mismatch ends the walk, which
 * matters because this runs for every command on every start-up.
 *
 * @param existingCommand The command Discord currently has.
 * @param apiData The payload the bot defines.
 * @param guildCommand Whether the command is registered in a guild rather than globally.
 * @returns `true` when the two differ in any way, `false` when they match.
 *
 * @since 1.0.0
 */
export function getCommandDifferencesFast(
	existingCommand: RESTPostAPIApplicationCommandsJSONBody,
	apiData: InternalAPICall["builtData"],
	guildCommand: boolean,
) {
	for (const _ of getCommandDifferences(
		existingCommand,
		apiData,
		guildCommand,
	)) {
		// The first difference settles it, so skip every remaining check.
		return true;
	}

	return false;
}

/**
 * Walks the registered command against the one the bot defines and describes everything that does
 * not match.
 *
 * This is the expensive path: it is only worth running when the differences are going to be shown
 * to somebody. Use {@link getCommandDifferencesFast} when a yes-or-no answer will do.
 *
 * @param existingCommand The command Discord currently has.
 * @param apiData The payload the bot defines.
 * @param guildCommand Whether the command is registered in a guild rather than globally. Guild
 * commands have no direct-message setting to compare, so that check is skipped for them.
 * @yields One difference per mismatch found.
 *
 * @since 1.0.0
 */
export function* getCommandDifferences(
	existingCommand: RESTPostAPIApplicationCommandsJSONBody,
	apiData: InternalAPICall["builtData"],
	guildCommand: boolean,
): Generator<CommandDifference> {
	if (
		existingCommand.type !== ApplicationCommandType.ChatInput &&
		existingCommand.type
	) {
		// Context menu entries carry no description and no options, so they need far fewer checks.
		if (
			contextMenuTypes.includes(
				existingCommand.type ?? ApplicationCommandType.ChatInput,
			)
		) {
			const casted =
				apiData as RESTPostAPIContextMenuApplicationCommandsJSONBody;

			yield* checkName({ oldName: existingCommand.name, newName: casted.name });

			if (!guildCommand) {
				yield* checkDMPermission(
					existingCommand.dm_permission,
					casted.dm_permission,
				);
			}

			yield* checkDefaultMemberPermissions(
				existingCommand.default_member_permissions,
				casted.default_member_permissions,
			);

			yield* checkLocalizations({
				localeMapName: "nameLocalizations",
				localePresentMessage: "localized names",
				localeMissingMessage: "no localized names",
				originalLocalizations: existingCommand.name_localizations,
				expectedLocalizations: casted.name_localizations,
			});

			yield* checkIntegrationTypes(
				existingCommand.integration_types,
				casted.integration_types,
			);

			yield* checkInteractionContextTypes(
				existingCommand.contexts,
				casted.contexts,
			);
		}

		return;
	}

	const casted = apiData as RESTPostAPIChatInputApplicationCommandsJSONBody;

	// Discord lowercases chat input names, so compare them case-insensitively.
	yield* checkName({
		oldName: existingCommand.name.toLowerCase(),
		newName: casted.name.toLowerCase(),
	});

	yield* checkLocalizations({
		localeMapName: "nameLocalizations",
		localePresentMessage: "localized names",
		localeMissingMessage: "no localized names",
		originalLocalizations: existingCommand.name_localizations,
		expectedLocalizations: casted.name_localizations,
	});

	if (!guildCommand) {
		yield* checkDMPermission(
			existingCommand.dm_permission,
			casted.dm_permission,
		);
	}

	yield* checkDefaultMemberPermissions(
		existingCommand.default_member_permissions,
		casted.default_member_permissions,
	);

	yield* checkDescription({
		oldDescription: existingCommand.description,
		newDescription: casted.description,
	});

	yield* checkLocalizations({
		localeMapName: "descriptionLocalizations",
		localePresentMessage: "localized descriptions",
		localeMissingMessage: "no localized descriptions",
		originalLocalizations: existingCommand.description_localizations,
		expectedLocalizations: casted.description_localizations,
	});

	yield* checkIntegrationTypes(
		existingCommand.integration_types,
		casted.integration_types,
	);

	yield* checkInteractionContextTypes(
		existingCommand.contexts,
		casted.contexts,
	);

	yield* checkOptions(existingCommand.options, casted.options);
}
