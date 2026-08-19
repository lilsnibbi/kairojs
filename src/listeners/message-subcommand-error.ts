import type { MessageSubcommandErrorPayload, PieceLoaderContext } from "@types";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports an error thrown by a message subcommand's handler.
 *
 * @since 1.0.0
 */
export class CoreMessageSubcommandErrorListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.MessageSubcommandError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: SubcommandPluginEvents.MessageSubcommandError,
		});
	}

	public run(error: unknown, payload: MessageSubcommandErrorPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error on message subcommand "${name}" at path "${location.full}"`,
			error,
		);
	}
}

void container.stores.loadPiece({
	name: "PluginMessageSubcommandError",
	piece: CoreMessageSubcommandErrorListener,
	store: "listeners",
});
