import type { Guild, ThreadChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isPrivateThreadChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is a private thread, the kind only invited members can
 * see.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The thread, `guildChannelError` when nothing matched, or
 * `guildPrivateThreadChannelError` when the match was not a private thread.
 *
 * @since 1.0.0
 */
export function resolveGuildPrivateThreadChannel(
	parameter: string,
	guild: Guild,
): Result<
	ThreadChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildThreadChannelError
	| typeof Identifiers.ArgumentGuildPrivateThreadChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isPrivateThreadChannel,
		Identifiers.ArgumentGuildPrivateThreadChannelError,
	);
}
