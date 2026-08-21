import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { ThreadChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveGuildThreadChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a thread of the guild the command was invoked in, of whichever kind.
 *
 * There is nothing to search outside a guild, so an invocation from a DM is refused up front rather
 * than reported as a channel that could not be found.
 *
 * @since 1.0.0
 */
export class CoreGuildThreadChannelArgument extends Argument<ThreadChannel> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guildThreadChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<ThreadChannel>,
	): ArgumentResult<ThreadChannel> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentGuildChannelMissingGuildError,
				message: "This command can only be used in a server.",
				context,
			});
		}

		return resolveGuildThreadChannel(parameter, guild).mapErrInto(
			(identifier) =>
				this.error({
					parameter,
					identifier,
					message: "The given argument did not resolve to a valid thread.",
					context: { ...context, guild },
				}),
		);
	}
}

void container.stores.loadPiece({
	name: "guildThreadChannel",
	piece: CoreGuildThreadChannelArgument,
	store: "arguments",
});
