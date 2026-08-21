import type {
	ApplicationCommandRegistryRegisterOptions,
	BulkOverwriteData,
	RegisterBehavior as RegisterBehaviorType,
	StoreOf,
} from "@types";
import { retry } from "@utilities/common/index.ts";
import {
	ApplicationCommandType,
	type ApplicationCommandManager,
} from "discord.js";
import {
	InternalRegistryAPIType,
	RegisterBehavior,
} from "@/constants/enums.ts";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import {
	emitBulkOverwriteError,
	emitPerRegistryError,
} from "./registryErrors.ts";
import { bulkOverwriteDebug, bulkOverwriteWarn } from "./log.ts";
import { getNeededRegistryParameters } from "./neededParameters.ts";
import { ApplicationCommandRegistry } from "./registry.ts";

/**
 * What happens, by default, when a registered command does not match the one a bot defines.
 *
 * Read it through {@link getDefaultBehaviorWhenNotIdentical} rather than importing the binding, so
 * a later change is always picked up.
 *
 * @since 1.0.0
 */
export let defaultBehaviorWhenNotIdentical: RegisterBehaviorType =
	RegisterBehavior.Overwrite;

/**
 * The guilds commands are registered in when a registration names none of its own.
 *
 * Read it through {@link getDefaultGuildIds} rather than importing the binding, so a later change is
 * always picked up.
 *
 * @since 1.0.0
 */
export let defaultGuildIds: ApplicationCommandRegistryRegisterOptions["guildIds"] =
	undefined;

/**
 * How many times a bulk overwrite may be attempted before the failure is reported.
 */
let bulkOverwriteRetries = 1;

/**
 * Every registry created so far, keyed by the name of the command that owns it.
 *
 * @since 1.0.0
 */
export const registries = new Map<string, ApplicationCommandRegistry>();

/**
 * Every guild any registry has asked about, gathered so all of their commands can be fetched in one
 * pass on start-up instead of once per command.
 *
 * @since 1.0.0
 */
export const allGuildIdsToFetchCommandsFor = new Set<string>();

/**
 * Returns the registry belonging to a command, creating it the first time it is asked for.
 *
 * The registry is created before the command itself exists, which is deliberate: a command reaches
 * for its registry in its own constructor.
 *
 * @param commandName The name of the command.
 *
 * @since 1.0.0
 */
export function acquire(commandName: string) {
	const existing = registries.get(commandName);
	if (existing) {
		return existing;
	}

	const newRegistry = new ApplicationCommandRegistry(commandName);
	registries.set(commandName, newRegistry);

	return newRegistry;
}

/**
 * Sets what happens, by default, when a registered command does not match the one a bot defines.
 *
 * This is where `BulkOverwrite` is chosen, since it hands Kairo ownership of the whole application's
 * commands and cannot sensibly be decided one command at a time.
 *
 * @param behavior The behaviour to use, or `null` to go back to `Overwrite`.
 *
 * @since 1.0.0
 */
export function setDefaultBehaviorWhenNotIdentical(
	behavior?: RegisterBehaviorType | null,
) {
	defaultBehaviorWhenNotIdentical = behavior ?? RegisterBehavior.Overwrite;
}

/**
 * Returns what happens, by default, when a registered command does not match the one a bot defines.
 *
 * @since 1.0.0
 */
export function getDefaultBehaviorWhenNotIdentical() {
	return defaultBehaviorWhenNotIdentical;
}

/**
 * Sets the guilds commands are registered in when a registration names none of its own.
 *
 * Guild commands appear the moment they are registered, whereas global ones can take up to an hour
 * to propagate, so pointing this at a development guild makes for a far shorter feedback loop.
 *
 * @param guildIds The guilds to default to, or `null` to register globally again.
 *
 * @since 1.0.0
 */
export function setDefaultGuildIds(
	guildIds?: ApplicationCommandRegistryRegisterOptions["guildIds"] | null,
) {
	defaultGuildIds = guildIds ?? undefined;
}

/**
 * Returns the guilds commands are registered in when a registration names none of its own.
 *
 * @since 1.0.0
 */
export function getDefaultGuildIds() {
	return defaultGuildIds;
}

/**
 * Sets how many times a bulk overwrite may be attempted.
 *
 * Only relevant while the default behaviour is `BulkOverwrite`, and only useful because the request
 * carries every command the application has and can time out on a slow connection.
 *
 * @param newAmountOfRetries The number of attempts, or `null` for the default of `1` — meaning a
 * single attempt and no retry.
 * @throws When given a number below `1`.
 *
 * @since 1.0.0
 */
export function setBulkOverwriteRetries(newAmountOfRetries: number | null) {
	newAmountOfRetries ??= 1;

	if (newAmountOfRetries <= 0)
		throw new RangeError("The amount of retries must be greater than 0");

	bulkOverwriteRetries = newAmountOfRetries;
}

/**
 * Returns how many times a bulk overwrite may be attempted.
 *
 * @since 1.0.0
 */
export function getBulkOverwriteRetries() {
	return bulkOverwriteRetries;
}

/**
 * Drives the whole registration pass: lets every command describe what it wants registered, then
 * reconciles all of it against Discord.
 *
 * This runs once the client is ready, because nothing can be compared until the application's
 * existing commands can be fetched.
 *
 * @since 1.0.0
 */
export async function handleRegistryAPICalls() {
	container.client.emit(Events.ApplicationCommandRegistriesInitialising);

	// The store registry is a plain collection keyed by store name, so its lookup cannot narrow to
	// the store being asked for. The commands store is registered long before this runs.
	const commandStore = container.stores.get("commands") as StoreOf<"commands">;

	for (const command of commandStore.values()) {
		if (command.registerApplicationCommands) {
			try {
				await command.registerApplicationCommands(
					command.applicationCommandRegistry,
				);
			} catch (error) {
				emitPerRegistryError(error, command);
			}
		}
	}

	if (getDefaultBehaviorWhenNotIdentical() === RegisterBehavior.BulkOverwrite) {
		await handleBulkOverwrite(
			commandStore,
			container.client.application!.commands,
		);
		return;
	}

	const parameters = await getNeededRegistryParameters(
		allGuildIdsToFetchCommandsFor,
	);

	await handleAppendOrUpdate(commandStore, parameters);
}

/**
 * Replaces the application's commands wholesale with the ones the bot defines.
 *
 * Two requests cover everything — one for the global commands, one per guild — which is both far
 * fewer round trips than reconciling command by command and the only way to delete commands the bot
 * no longer defines.
 *
 * @param commandStore The store holding every loaded command.
 * @param applicationCommands The application's command manager.
 *
 * @since 1.0.0
 */
export async function handleBulkOverwrite(
	commandStore: StoreOf<"commands">,
	applicationCommands: ApplicationCommandManager,
) {
	const now = Date.now();

	// Sort every queued registration into the request it belongs to.
	const foundGlobalCommands: BulkOverwriteData[] = [];
	const foundGuildCommands: Record<string, BulkOverwriteData[]> = {};

	for (const command of commandStore.values()) {
		const registry = command.applicationCommandRegistry;

		for (const call of registry.apiCalls) {
			// Guild-only command.
			if (call.registerOptions.guildIds?.length) {
				for (const guildId of call.registerOptions.guildIds) {
					foundGuildCommands[guildId] ??= [];

					foundGuildCommands[guildId].push({
						piece: command,
						data: call.builtData,
					});
				}
				continue;
			}

			// Global command.
			foundGlobalCommands.push({ piece: command, data: call.builtData });
		}
	}

	await retry(
		() =>
			handleBulkOverwriteGlobalCommands(
				commandStore,
				applicationCommands,
				foundGlobalCommands,
			),
		bulkOverwriteRetries,
	);

	for (const [guildId, guildCommands] of Object.entries(foundGuildCommands)) {
		await retry(
			() =>
				handleBulkOverwriteGuildCommands(
					commandStore,
					applicationCommands,
					guildId,
					guildCommands,
				),
			bulkOverwriteRetries,
		);
	}

	container.client.emit(
		Events.ApplicationCommandRegistriesRegistered,
		registries,
		Date.now() - now,
	);
}

/**
 * Sends the application's global commands in one request and files the ids Discord hands back.
 *
 * @param commandStore The store holding every loaded command.
 * @param applicationCommands The application's command manager.
 * @param foundGlobalCommands The payloads to send, each paired with the command it came from.
 */
async function handleBulkOverwriteGlobalCommands(
	commandStore: StoreOf<"commands">,
	applicationCommands: ApplicationCommandManager,
	foundGlobalCommands: BulkOverwriteData[],
) {
	try {
		bulkOverwriteDebug(
			`Overwriting global application commands, now at ${foundGlobalCommands.length} commands`,
		);
		const result = await applicationCommands.set(
			foundGlobalCommands.map((entry) => entry.data),
		);

		// Match each command Discord echoed back to the command it was built from, and alias its id.
		for (const [id, globalCommand] of result.entries()) {
			const piece = foundGlobalCommands.find(
				(entry) => entry.data.name === globalCommand.name,
			)?.piece;

			if (piece) {
				const registry = piece.applicationCommandRegistry;

				switch (globalCommand.type) {
					case ApplicationCommandType.ChatInput: {
						registry.handleIdAddition(InternalRegistryAPIType.ChatInput, id);
						break;
					}
					case ApplicationCommandType.User:
					case ApplicationCommandType.Message: {
						registry.handleIdAddition(InternalRegistryAPIType.ContextMenu, id);
						break;
					}
				}

				// A bulk overwrite reassigns ids freely, so id hints and hand-added names are worthless
				// here and only what Discord just returned is trusted.
				commandStore.aliases.set(id, piece);
			} else {
				bulkOverwriteWarn(
					`Registered global command "${globalCommand.name}" (${id}) but failed to find the piece in the command store. This should not happen`,
				);
			}
		}

		container.client.emit(
			Events.ApplicationCommandRegistriesBulkOverwrite,
			result,
			null,
		);
	} catch (error) {
		// An abort has to travel up so the retry wrapper can make another attempt.
		if (error instanceof Error && error.name === "AbortError") throw error;

		emitBulkOverwriteError(error, null);
	}
}

/**
 * Sends one guild's commands in a single request and files the ids Discord hands back.
 *
 * @param commandStore The store holding every loaded command.
 * @param applicationCommands The application's command manager.
 * @param guildId The guild being overwritten.
 * @param guildCommands The payloads to send, each paired with the command it came from.
 */
async function handleBulkOverwriteGuildCommands(
	commandStore: StoreOf<"commands">,
	applicationCommands: ApplicationCommandManager,
	guildId: string,
	guildCommands: BulkOverwriteData[],
) {
	try {
		bulkOverwriteDebug(
			`Overwriting guild application commands for guild ${guildId}, now at ${guildCommands.length} commands`,
		);
		const result = await applicationCommands.set(
			guildCommands.map((entry) => entry.data),
			guildId,
		);

		// Names are unique within a guild — Discord rejects duplicates — so matching on them is safe.
		for (const [id, guildCommand] of result.entries()) {
			const piece = guildCommands.find(
				(entry) => entry.data.name === guildCommand.name,
			)?.piece;

			if (piece) {
				const registry = piece.applicationCommandRegistry;

				switch (guildCommand.type) {
					case ApplicationCommandType.ChatInput: {
						registry.handleIdAddition(
							InternalRegistryAPIType.ChatInput,
							id,
							guildId,
						);
						break;
					}
					case ApplicationCommandType.User:
					case ApplicationCommandType.Message: {
						registry.handleIdAddition(
							InternalRegistryAPIType.ContextMenu,
							id,
							guildId,
						);
						break;
					}
				}

				// A bulk overwrite reassigns ids freely, so id hints and hand-added names are worthless
				// here and only what Discord just returned is trusted.
				commandStore.aliases.set(id, piece);
			} else {
				bulkOverwriteWarn(
					`Registered guild command "${guildCommand.name}" (${id}) but failed to find the piece in the command store. This should not happen`,
				);
			}
		}

		container.client.emit(
			Events.ApplicationCommandRegistriesBulkOverwrite,
			result,
			guildId,
		);
	} catch (error) {
		// An abort has to travel up so the retry wrapper can make another attempt.
		if (error instanceof Error && error.name === "AbortError") throw error;

		emitBulkOverwriteError(error, guildId);
	}
}

/**
 * Reconciles every registry one at a time, creating or updating only what actually differs and
 * leaving commands the bot does not define alone.
 *
 * @param commandStore The store holding every loaded command.
 * @param parameters The command manager and the commands already registered, global and per guild.
 */
async function handleAppendOrUpdate(
	commandStore: StoreOf<"commands">,
	{
		applicationCommands,
		globalCommands,
		guildCommands,
	}: Awaited<ReturnType<typeof getNeededRegistryParameters>>,
) {
	const now = Date.now();

	for (const registry of registries.values()) {
		await registry.runApiCalls(
			applicationCommands,
			globalCommands,
			guildCommands,
		);

		const piece = registry.command;

		if (piece) {
			for (const nameOrId of piece.applicationCommandRegistry
				.chatInputCommands) {
				commandStore.aliases.set(nameOrId, piece);
			}

			for (const nameOrId of piece.applicationCommandRegistry
				.contextMenuCommands) {
				commandStore.aliases.set(nameOrId, piece);
			}
		}
	}

	container.client.emit(
		Events.ApplicationCommandRegistriesRegistered,
		registries,
		Date.now() - now,
	);
}
