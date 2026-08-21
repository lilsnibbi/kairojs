import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import type { Command } from "@/structures/command.ts";
import { bulkOverwriteError } from "./log.ts";

/**
 * Reports an error thrown while a command was building its own application-command registrations.
 *
 * A bot that listens for the event gets the raw error and the command it came from and can decide
 * what to do; when nobody is listening the error would otherwise vanish, so it is logged instead.
 *
 * @param error The error that was thrown.
 * @param command The command whose registration threw.
 *
 * @since 1.0.0
 */
export function emitPerRegistryError(error: unknown, command: Command) {
	const { name, location } = command;
	const { client, logger } = container;

	if (client.listenerCount(Events.CommandApplicationCommandRegistryError)) {
		client.emit(Events.CommandApplicationCommandRegistryError, error, command);
	} else {
		logger.error(
			`Encountered error while handling the command application command registry for command "${name}" at path "${location.full}"`,
			error,
		);
	}
}

/**
 * Reports an error thrown while overwriting the application's commands in bulk.
 *
 * As with the per-command variant, a listening bot is handed the error untouched; otherwise it is
 * logged, naming the guild it happened in so a single failing guild is easy to spot.
 *
 * @param error The error that was thrown.
 * @param guildId The guild the overwrite was for, or `null` for the global commands.
 *
 * @since 1.0.0
 */
export function emitBulkOverwriteError(error: unknown, guildId: string | null) {
	const { client } = container;

	if (
		client.listenerCount(Events.ApplicationCommandRegistriesBulkOverwriteError)
	) {
		client.emit(
			Events.ApplicationCommandRegistriesBulkOverwriteError,
			error,
			guildId,
		);
	} else if (guildId) {
		bulkOverwriteError(
			`Failed to overwrite guild application commands for guild ${guildId}`,
			error,
		);
	} else {
		bulkOverwriteError(
			"Failed to overwrite global application commands",
			error,
		);
	}
}
