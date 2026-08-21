import type {
	ChannelTypes,
	GuildBasedChannelTypes,
	Identifier,
	Nullish,
} from "@types";
import type { Guild } from "discord.js";
import type { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";
import { resolveGuildChannel } from "./guildChannel.ts";

/**
 * The shared body behind every channel resolver that narrows {@link resolveGuildChannel} to one
 * particular kind of channel.
 *
 * Resolution failures keep reporting `guildChannelError`, and only a channel that was found but is
 * of the wrong kind reports the caller's own identifier, so a bot can tell "no such channel" apart
 * from "that channel is not a voice channel".
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @param predicate The type guard the resolved channel has to satisfy.
 * @param error The identifier to report when the channel exists but fails the guard.
 *
 * @internal
 * @since 1.0.0
 */
export function resolveGuildChannelPredicate<
	TChannel extends GuildBasedChannelTypes,
	TError extends Identifier,
>(
	parameter: string,
	guild: Guild,
	predicate: (channel: ChannelTypes | Nullish) => channel is TChannel,
	error: TError,
): Result<TChannel, TError | typeof Identifiers.ArgumentGuildChannelError> {
	return resolveGuildChannel(parameter, guild).mapInto((channel) =>
		predicate(channel) ? ok(channel) : err(error),
	);
}
