import type {
	ContextMenuCommandErrorPayload,
	PieceLoaderContext,
} from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes a context-menu command's uncaught error to the logger.
 *
 * @since 1.0.0
 */
export class CoreContextMenuCommandErrorListener extends Listener<
	"client",
	typeof Events.ContextMenuCommandError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.ContextMenuCommandError });
	}

	public run(error: unknown, payload: ContextMenuCommandErrorPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error on context menu command "${name}" at path "${location.full}"`,
			error,
		);
	}
}
