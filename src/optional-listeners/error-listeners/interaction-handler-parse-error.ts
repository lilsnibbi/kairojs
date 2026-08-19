import type { InteractionHandlerParseError, PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes to the logger when an interaction handler's `parse` throws.
 *
 * @since 1.0.0
 */
export class CoreInteractionHandlerParseErrorListener extends Listener<
	"client",
	typeof Events.InteractionHandlerParseError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.InteractionHandlerParseError,
		});
	}

	public run(error: unknown, payload: InteractionHandlerParseError) {
		const { name, location } = payload.handler;
		this.container.logger.error(
			`Encountered error while handling an interaction handler parse method for interaction-handler "${name}" at path "${location.full}"`,
			error,
		);
	}
}
