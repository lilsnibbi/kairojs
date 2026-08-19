import type { Guild, ThreadChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isPublicThreadChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is a public thread, the kind anyone who can see the
 * parent channel may join.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The thread, `guildChannelError` when nothing matched, or
 * `guildPublicThreadChannelError` when the match was not a public thread.
 *
 * @since 1.0.0
 */
export function resolveGuildPublicThreadChannel(
	parameter: string,
	guild: Guild,
): Result<
	ThreadChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildThreadChannelError
	| typeof Identifiers.ArgumentGuildPublicThreadChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isPublicThreadChannel,
		Identifiers.ArgumentGuildPublicThreadChannelError,
	);
}
