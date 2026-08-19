import type {
	ArgumentContext,
	ArgumentResult,
	ChannelTypes,
	PieceLoaderContext,
} from "@types";
import { container } from "@/container.ts";
import { resolveChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a channel mention or id against whatever cache is in scope — the invoking guild's channels
 * inside a guild, the client-wide cache outside one.
 *
 * @since 1.0.0
 */
export class CoreChannelArgument extends Argument<ChannelTypes> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "channel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<ChannelTypes>,
	): ArgumentResult<ChannelTypes> {
		return resolveChannel(parameter, context.message).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The argument did not resolve to a channel.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "channel",
	piece: CoreChannelArgument,
	store: "arguments",
});
