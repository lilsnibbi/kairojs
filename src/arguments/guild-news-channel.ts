import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { NewsChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveGuildNewsChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses an announcement channel of the guild the command was invoked in.
 *
 * There is nothing to search outside a guild, so an invocation from a DM is refused up front rather
 * than reported as a channel that could not be found.
 *
 * @since 1.0.0
 */
export class CoreGuildNewsChannelArgument extends Argument<NewsChannel> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guildNewsChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<NewsChannel>,
	): ArgumentResult<NewsChannel> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentGuildChannelMissingGuildError,
				message: "This command can only be used in a server.",
				context,
			});
		}

		return resolveGuildNewsChannel(parameter, guild).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message:
					"The given argument did not resolve to a valid announcements channel.",
				context: { ...context, guild },
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "guildNewsChannel",
	piece: CoreGuildNewsChannelArgument,
	store: "arguments",
});
