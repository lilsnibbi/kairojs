import type { InteractionHandlerError, PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes to the logger when an interaction handler's `run` throws.
 *
 * @since 1.0.0
 */
export class CoreInteractionHandlerErrorListener extends Listener<
	"client",
	typeof Events.InteractionHandlerError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.InteractionHandlerError });
	}

	public run(error: unknown, payload: InteractionHandlerError) {
		const { name, location } = payload.handler;
		this.container.logger.error(
			`Encountered error while handling an interaction handler run method for interaction-handler "${name}" at path "${location.full}"`,
			error,
		);
	}
}
