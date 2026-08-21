import type { ChannelTypes } from "@types";
import type { CommandInteraction, Message, Snowflake } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { ChannelMentionRegex } from "@utilities/discord/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves a channel mention or bare snowflake against whatever cache is in scope.
 *
 * Inside a guild only that guild's channels are searched, which keeps a command from reaching into
 * a server it was not invoked in. Outside one the client-wide cache is used instead, so DM
 * channels remain reachable.
 *
 * @param parameter The channel mention or id to look up.
 * @param messageOrInteraction The message or interaction the lookup is scoped to.
 * @returns The cached channel, or `channelError` when nothing matches.
 *
 * @since 1.0.0
 */
export function resolveChannel(
	parameter: string,
	messageOrInteraction: Message | CommandInteraction,
): Result<ChannelTypes, typeof Identifiers.ArgumentChannelError> {
	const channelId = (ChannelMentionRegex.exec(parameter)?.[1] ??
		parameter) as Snowflake;
	const manager = messageOrInteraction.guild
		? messageOrInteraction.guild.channels
		: container.client.channels;
	const channel = manager.cache.get(channelId);

	if (channel) {
		return ok(channel as ChannelTypes);
	}

	return err(Identifiers.ArgumentChannelError);
}
