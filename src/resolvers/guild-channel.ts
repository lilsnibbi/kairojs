import type { GuildBasedChannelTypes } from "@types";
import type { Guild, Snowflake } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import {
	ChannelMentionRegex,
	SnowflakeRegex,
} from "@utilities/discord-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves any channel belonging to a guild, by mention, by id or by exact name.
 *
 * Identifiers win over names, so a parameter that looks like a snowflake is never interpreted as a
 * channel called after a number. Name matching is case-insensitive but not fuzzy, and the search
 * only covers channels already in the cache.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The channel, or `guildChannelError` when nothing matches.
 *
 * @since 1.0.0
 */
export function resolveGuildChannel(
	parameter: string,
	guild: Guild,
): Result<
	GuildBasedChannelTypes,
	typeof Identifiers.ArgumentGuildChannelError
> {
	const channel = findById(parameter, guild) ?? findByName(parameter, guild);

	if (channel) {
		return ok(channel);
	}

	return err(Identifiers.ArgumentGuildChannelError);
}

/**
 * Looks the channel up by mention or raw snowflake.
 */
function findById(
	parameter: string,
	guild: Guild,
): GuildBasedChannelTypes | null {
	const match =
		ChannelMentionRegex.exec(parameter) ?? SnowflakeRegex.exec(parameter);
	return match
		? ((guild.channels.cache.get(
				match[1] as Snowflake,
			) as GuildBasedChannelTypes) ?? null)
		: null;
}

/**
 * Looks the channel up by an exact, case-insensitive name match.
 */
function findByName(
	parameter: string,
	guild: Guild,
): GuildBasedChannelTypes | null {
	const normalized = parameter.toLowerCase();
	return (
		(guild.channels.cache.find(
			(channel) => channel.name.toLowerCase() === normalized,
		) as GuildBasedChannelTypes) ?? null
	);
}
