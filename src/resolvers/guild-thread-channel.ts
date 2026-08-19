import type { Guild, ThreadChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isThreadChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is a thread of any kind — public, private, or one
 * started from an announcement post.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The thread, `guildChannelError` when nothing matched, or `guildThreadChannelError`
 * when the match was not a thread.
 *
 * @since 1.0.0
 */
export function resolveGuildThreadChannel(
	parameter: string,
	guild: Guild,
): Result<
	ThreadChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildThreadChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isThreadChannel,
		Identifiers.ArgumentGuildThreadChannelError,
	);
}
