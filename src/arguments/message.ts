import type {
	AsyncArgumentResult,
	MessageArgumentContext,
	PieceLoaderContext,
} from "@types";
import type { Message } from "discord.js";
import { container } from "@/container.ts";
import { resolveMessage } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a message from any of the three shapes people paste into chat: a bare id, a full message
 * link, or the `channelId-messageId` pair the client produces on a shift-click.
 *
 * @since 1.0.0
 */
export class CoreMessageArgument extends Argument<Message> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "message" });
	}

	public async run(
		parameter: string,
		context: MessageArgumentContext,
	): AsyncArgumentResult<Message> {
		// Recorded on the error rather than passed to the resolver, which falls back on its own.
		const channel = context.channel ?? context.message.channel;

		const resolved = await resolveMessage(parameter, {
			messageOrInteraction: context.message,
			channel: context.channel,
			scan: context.scan ?? false,
		});

		return resolved.mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The given argument did not resolve to a message.",
				context: { ...context, channel },
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "message",
	piece: CoreMessageArgument,
	store: "arguments",
});
