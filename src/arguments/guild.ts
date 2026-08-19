import type {
	ArgumentContext,
	AsyncArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { Guild } from "discord.js";
import { container } from "@/container.ts";
import { resolveGuild } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a guild id, fetching the guild from Discord when it is not already cached. Names are not
 * accepted, since they are not unique.
 *
 * @since 1.0.0
 */
export class CoreGuildArgument extends Argument<Guild> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guild" });
	}

	public async run(
		parameter: string,
		context: ArgumentContext<Guild>,
	): AsyncArgumentResult<Guild> {
		const resolved = await resolveGuild(parameter);

		return resolved.mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The given argument did not resolve to a Discord guild.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "guild",
	piece: CoreGuildArgument,
	store: "arguments",
});
