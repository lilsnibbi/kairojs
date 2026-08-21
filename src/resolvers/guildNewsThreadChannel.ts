import type { Guild, ThreadChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isNewsThreadChannel } from "@utilities/discordjs/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guildChannelPredicate.ts";

/**
 * Resolves a guild channel and insists it is a thread started from an announcement post.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The thread, `guildChannelError` when nothing matched, or
 * `guildNewsThreadChannelError` when the match was not an announcement thread.
 *
 * @since 1.0.0
 */
export function resolveGuildNewsThreadChannel(
	parameter: string,
	guild: Guild,
): Result<
	ThreadChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildThreadChannelError
	| typeof Identifiers.ArgumentGuildNewsThreadChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isNewsThreadChannel,
		Identifiers.ArgumentGuildNewsThreadChannelError,
	);
}
