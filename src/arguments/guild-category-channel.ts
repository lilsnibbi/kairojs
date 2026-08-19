import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { CategoryChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveGuildCategoryChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a category channel of the guild the command was invoked in.
 *
 * There is nothing to search outside a guild, so an invocation from a DM is refused up front rather
 * than reported as a channel that could not be found.
 *
 * @since 1.0.0
 */
export class CoreGuildCategoryChannelArgument extends Argument<CategoryChannel> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guildCategoryChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<CategoryChannel>,
	): ArgumentResult<CategoryChannel> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentGuildChannelMissingGuildError,
				message: "This command can only be used in a server.",
				context,
			});
		}

		return resolveGuildCategoryChannel(parameter, guild).mapErrInto(
			(identifier) =>
				this.error({
					parameter,
					identifier,
					message:
						"The argument did not resolve to a valid server category channel.",
					context: { ...context, guild },
				}),
		);
	}
}

void container.stores.loadPiece({
	name: "guildCategoryChannel",
	piece: CoreGuildCategoryChannelArgument,
	store: "arguments",
});
