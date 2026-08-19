import type { DMChannel, Message, PartialDMChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isDMChannel } from "@utilities/discord.js-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";
import { resolveChannel } from "./channel.ts";

/**
 * Resolves a channel and insists it is a one-on-one DM, accepting a partial one.
 *
 * This is the lenient counterpart to {@link resolveDMChannel}: a partial carries the same channel
 * type as a fully cached DM, so it passes here even though most of its data is missing.
 *
 * @param parameter The channel mention or id to look up.
 * @param message The message the lookup is scoped to.
 * @returns The DM channel, `channelError` when nothing matched, or `dmChannelError` when the
 * match was not a DM channel.
 *
 * @since 1.0.0
 */
export function resolvePartialDMChannel(
	parameter: string,
	message: Message,
): Result<
	DMChannel | PartialDMChannel,
	| typeof Identifiers.ArgumentChannelError
	| typeof Identifiers.ArgumentDMChannelError
> {
	return resolveChannel(parameter, message).mapInto((channel) => {
		if (isDMChannel(channel)) {
			return ok(channel);
		}

		return err(Identifiers.ArgumentDMChannelError);
	});
}
