import type { Guild, TextChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isTextChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is an ordinary text channel.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The text channel, `guildChannelError` when nothing matched, or
 * `guildTextChannelError` when the match was not a text channel.
 *
 * @since 1.0.0
 */
export function resolveGuildTextChannel(
	parameter: string,
	guild: Guild,
): Result<
	TextChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildTextChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isTextChannel,
		Identifiers.ArgumentGuildTextChannelError,
	);
}
