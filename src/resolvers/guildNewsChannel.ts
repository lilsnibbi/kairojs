import type { Guild, NewsChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isNewsChannel } from "@utilities/discordjs/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guildChannelPredicate.ts";

/**
 * Resolves a guild channel and insists it is an announcement channel, the kind other servers can
 * follow.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The announcement channel, `guildChannelError` when nothing matched, or
 * `guildNewsChannelError` when the match was not an announcement channel.
 *
 * @since 1.0.0
 */
export function resolveGuildNewsChannel(
	parameter: string,
	guild: Guild,
): Result<
	NewsChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildNewsChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isNewsChannel,
		Identifiers.ArgumentGuildNewsChannelError,
	);
}
