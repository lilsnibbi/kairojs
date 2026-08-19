import type { PieceLoaderContext } from "@types";
import type { Message } from "discord.js";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * The head of the message command pipeline.
 *
 * Bots and webhooks are dropped here rather than further down, so nothing later in the chain has to
 * think about them — and so two bots cannot be goaded into answering each other forever.
 *
 * @since 1.0.0
 */
export class CoreMessageCreateListener extends Listener<
	"client",
	typeof Events.MessageCreate
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.MessageCreate });
	}

	public run(message: Message) {
		if (message.author.bot || message.webhookId) return;

		this.container.client.emit(Events.PreMessageParsed, message);
	}
}
