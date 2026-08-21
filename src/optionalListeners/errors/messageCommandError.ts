import type { MessageCommandErrorPayload, PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes a message command's uncaught error to the logger.
 *
 * @since 1.0.0
 */
export class CoreMessageCommandErrorListener extends Listener<
	"client",
	typeof Events.MessageCommandError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.MessageCommandError });
	}

	public run(error: unknown, payload: MessageCommandErrorPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error on message command "${name}" at path "${location.full}"`,
			error,
		);
	}
}
