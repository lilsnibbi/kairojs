import type {
	ArgumentContext,
	AsyncArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { User } from "discord.js";
import { container } from "@/container.ts";
import { resolveUser } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a user mention or id, fetching the user from Discord when they are not cached. The lookup
 * is global, so it finds people the bot shares no server with.
 *
 * @since 1.0.0
 */
export class CoreUserArgument extends Argument<User> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "user" });
	}

	public async run(
		parameter: string,
		context: ArgumentContext<User>,
	): AsyncArgumentResult<User> {
		const resolved = await resolveUser(parameter);

		return resolved.mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The given argument did not resolve to a Discord user.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "user",
	piece: CoreUserArgument,
	store: "arguments",
});
