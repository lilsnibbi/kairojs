import { container } from "@/container.ts";
import type {
	ApplicationCommand,
	ApplicationCommandManager,
	Collection,
} from "discord.js";

/**
 * Fetches everything the registries need before they can decide what to register, update or leave
 * alone: the command manager itself, the application's global commands, and the commands of every
 * guild any registry asked about.
 *
 * Localizations are requested along with the commands, because a command whose translations changed
 * has to count as different and they are not included by default.
 *
 * @param guildIds The guilds whose commands should be fetched.
 *
 * @since 1.0.0
 */
export async function getNeededRegistryParameters(
	guildIds: Set<string> = new Set(),
) {
	const { client } = container;

	const applicationCommands = client.application!.commands;
	const globalCommands = await applicationCommands.fetch({
		withLocalizations: true,
	});
	const guildCommands = await fetchGuildCommands(applicationCommands, guildIds);

	return {
		applicationCommands,
		globalCommands,
		guildCommands,
	};
}

/**
 * Fetches the commands of each guild in turn.
 *
 * A guild that the application was never authorized in with the `applications.commands` scope will
 * refuse the request, and that must not take down the whole start-up — so each failure is logged
 * and the walk continues. Bots that knowingly list such guilds can silence the log entirely, or
 * per guild, through the `preventFailedToFetchLogForGuilds` client option.
 *
 * @param commands The application's command manager.
 * @param guildIds The guilds to fetch for.
 */
async function fetchGuildCommands(
	commands: ApplicationCommandManager,
	guildIds: Set<string>,
) {
	const commandsByGuild = new Map<
		string,
		Collection<string, ApplicationCommand>
	>();

	for (const guildId of guildIds) {
		try {
			commandsByGuild.set(
				guildId,
				await commands.fetch({ guildId, withLocalizations: true }),
			);
		} catch {
			const { preventFailedToFetchLogForGuilds } = container.client.options;

			if (preventFailedToFetchLogForGuilds === true) continue;

			if (
				Array.isArray(preventFailedToFetchLogForGuilds) &&
				!preventFailedToFetchLogForGuilds?.includes(guildId)
			) {
				const guild = container.client.guilds.resolve(guildId) ?? {
					name: "Guild not in cache",
				};
				container.logger.warn(
					`ApplicationCommandRegistries: Failed to fetch guild commands for guild "${guild.name}" (${guildId}).`,
					'Make sure to authorize your application with the "applications.commands" scope in that guild.',
				);
			}
		}
	}

	return commandsByGuild;
}
