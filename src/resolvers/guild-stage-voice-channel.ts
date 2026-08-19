import type { Guild, StageChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isStageChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is a stage channel, the voice channel variant built
 * around speakers and an audience.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The stage channel, `guildChannelError` when nothing matched, or
 * `guildStageVoiceChannelError` when the match was not a stage channel.
 *
 * @since 1.0.0
 */
export function resolveGuildStageVoiceChannel(
	parameter: string,
	guild: Guild,
): Result<
	StageChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildStageVoiceChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isStageChannel,
		Identifiers.ArgumentGuildStageVoiceChannelError,
	);
}
