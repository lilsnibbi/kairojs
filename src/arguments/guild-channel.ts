import type {
	ArgumentContext,
	ArgumentResult,
	GuildBasedChannelTypes,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveGuildChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses any channel of the guild the command was invoked in, by mention, id or exact name.
 *
 * There is nothing to search outside a guild, so an invocation from a DM is refused up front rather
 * than reported as a channel that could not be found.
 *
 * @since 1.0.0
 */
export class CoreGuildChannelArgument extends Argument<GuildBasedChannelTypes> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guildChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<GuildBasedChannelTypes>,
	): ArgumentResult<GuildBasedChannelTypes> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentGuildChannelMissingGuildError,
				message: "This command can only be used in a server.",
				context,
			});
		}

		return resolveGuildChannel(parameter, guild).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The argument did not resolve to a valid server channel.",
				context: { ...context, guild },
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "guildChannel",
	piece: CoreGuildChannelArgument,
	store: "arguments",
});
