import type { ListenerErrorPayload, PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes another listener's uncaught error to the logger.
 *
 * The event name is included because one piece can be attached to an event that fires from several
 * places, and knowing which one failed is usually the first question asked.
 *
 * @since 1.0.0
 */
export class CoreListenerErrorListener extends Listener<
	"client",
	typeof Events.ListenerError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.ListenerError });
	}

	public run(error: unknown, payload: ListenerErrorPayload) {
		const { name, event, location } = payload.piece;
		this.container.logger.error(
			`Encountered error on event listener "${name}" for event "${String(event)}" at path "${location.full}"`,
			error,
		);
	}
}
