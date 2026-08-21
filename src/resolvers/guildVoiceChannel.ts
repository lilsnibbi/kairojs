import type { Guild, VoiceChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isVoiceChannel } from "@utilities/discordjs/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guildChannelPredicate.ts";

/**
 * Resolves a guild channel and insists it is a voice channel.
 *
 * Stage channels are voice-based but are a distinct type, so they are turned away here; use
 * {@link resolveGuildStageVoiceChannel} for those.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The voice channel, `guildChannelError` when nothing matched, or
 * `guildVoiceChannelError` when the match was not a voice channel.
 *
 * @since 1.0.0
 */
export function resolveGuildVoiceChannel(
	parameter: string,
	guild: Guild,
): Result<
	VoiceChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildVoiceChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isVoiceChannel,
		Identifiers.ArgumentGuildVoiceChannelError,
	);
}
