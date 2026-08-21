import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { DMChannel } from "discord.js";
import { container } from "@/container.ts";
import { resolveDMChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a channel reference and insists it is a fully cached one-on-one DM. Use `partialDMChannel`
 * where a partial will do.
 *
 * @since 1.0.0
 */
export class CoreDMChannelArgument extends Argument<DMChannel> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "dmChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<DMChannel>,
	): ArgumentResult<DMChannel> {
		return resolveDMChannel(parameter, context.message).mapErrInto(
			(identifier) =>
				this.error({
					parameter,
					identifier,
					message: "The argument did not resolve to a DM channel.",
					context,
				}),
		);
	}
}

void container.stores.loadPiece({
	name: "dmChannel",
	piece: CoreDMChannelArgument,
	store: "arguments",
});
