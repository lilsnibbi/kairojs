import type { Guild } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { SnowflakeRegex } from "@utilities/discord/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves a guild by its snowflake, fetching it from the API when it is not already cached.
 *
 * Only an id is accepted — guild names are not unique and cannot be searched for reliably.
 *
 * @param parameter The guild id to look up.
 * @returns The guild, or `guildError` when the text is not a snowflake or the bot is not a member
 * of that guild.
 *
 * @since 1.0.0
 */
export async function resolveGuild(
	parameter: string,
): Promise<Result<Guild, typeof Identifiers.ArgumentGuildError>> {
	const guildId = SnowflakeRegex.exec(parameter)?.groups?.id;
	const guild = guildId
		? await container.client.guilds.fetch(guildId).catch(() => null)
		: null;

	if (guild) {
		return ok(guild);
	}

	return err(Identifiers.ArgumentGuildError);
}
