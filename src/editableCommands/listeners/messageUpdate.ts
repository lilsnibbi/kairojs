import type {
	Message,
	OmitPartialGroupDMChannel,
	PartialMessage,
} from "discord.js";
import type { PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Re-runs the message command pipeline when a user edits their own message.
 *
 * Without this listener a command is only ever parsed once, at the moment the message is created;
 * with it, correcting a typo in an invocation runs the corrected command, and {@link send} makes the
 * bot edit its previous answer rather than posting a second one.
 *
 * @since 1.0.0
 */
export class EditableCommandsMessageUpdateListener extends Listener<
	"client",
	typeof Events.MessageUpdate
> {
	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 */
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.MessageUpdate });
	}

	/**
	 * Feeds the edited message back into the command pipeline, unless it is one the pipeline would
	 * never have accepted in the first place.
	 *
	 * @param previous The message as it was before the edit.
	 * @param message The message as it is now.
	 */
	public run(
		previous: OmitPartialGroupDMChannel<Message | PartialMessage>,
		message: OmitPartialGroupDMChannel<Message>,
	) {
		// An edit that leaves the content alone — a link unfurling, a pin, a reaction — cannot have
		// changed which command was invoked.
		if (previous.content === message.content) return;

		// Webhooks, system messages and bots are all excluded from the pipeline on creation too, so
		// admitting them here would let an edit run a command that could never have been started.
		if (message.webhookId !== null) return;
		if (message.system) return;
		if (message.author.bot) return;

		this.container.client.emit(Events.PreMessageParsed, message);
	}
}
