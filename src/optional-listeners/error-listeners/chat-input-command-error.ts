import type { ChatInputCommandErrorPayload, PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes a slash command's uncaught error to the logger.
 *
 * @since 1.0.0
 */
export class CoreChatInputCommandErrorListener extends Listener<
	"client",
	typeof Events.ChatInputCommandError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.ChatInputCommandError });
	}

	public run(error: unknown, payload: ChatInputCommandErrorPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error on chat input command "${name}" at path "${location.full}"`,
			error,
		);
	}
}
