import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { DMChannel, PartialDMChannel } from "discord.js";
import { container } from "@/container.ts";
import { resolvePartialDMChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a channel reference and insists it is a one-on-one DM, accepting a partial one. This is the
 * lenient counterpart to the `dmChannel` argument.
 *
 * @since 1.0.0
 */
export class CorePartialDMChannelArgument extends Argument<
	DMChannel | PartialDMChannel
> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "partialDMChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<DMChannel | PartialDMChannel>,
	): ArgumentResult<DMChannel | PartialDMChannel> {
		return resolvePartialDMChannel(parameter, context.message).mapErrInto(
			(identifier) =>
				this.error({
					parameter,
					identifier,
					message: "The argument did not resolve to a Partial DM channel.",
					context,
				}),
		);
	}
}

void container.stores.loadPiece({
	name: "partialDMChannel",
	piece: CorePartialDMChannelArgument,
	store: "arguments",
});
