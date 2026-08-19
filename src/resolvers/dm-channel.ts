import type { CommandInteraction, DMChannel, Message } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isDMChannel } from "@utilities/discord.js-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";
import { resolveChannel } from "./channel.ts";

/**
 * Resolves a channel and insists it is a fully cached one-on-one DM.
 *
 * Partial DM channels are turned away because too little of them is known to be useful; use
 * {@link resolvePartialDMChannel} when a partial is acceptable.
 *
 * @param parameter The channel mention or id to look up.
 * @param messageOrInteraction The message or interaction the lookup is scoped to.
 * @returns The DM channel, `channelError` when nothing matched, or `dmChannelError` when the
 * match was not a complete DM channel.
 *
 * @since 1.0.0
 */
export function resolveDMChannel(
	parameter: string,
	messageOrInteraction: Message | CommandInteraction,
): Result<
	DMChannel,
	| typeof Identifiers.ArgumentChannelError
	| typeof Identifiers.ArgumentDMChannelError
> {
	return resolveChannel(parameter, messageOrInteraction).mapInto((channel) => {
		if (isDMChannel(channel) && !channel.partial) {
			return ok(channel);
		}

		return err(Identifiers.ArgumentDMChannelError);
	});
}
