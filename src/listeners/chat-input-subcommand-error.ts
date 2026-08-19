import type {
	ChatInputSubcommandErrorPayload,
	PieceLoaderContext,
} from "@types";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports an error thrown by a chat input subcommand's handler.
 *
 * The subcommand router swallows the throw so it cannot become an unhandled rejection; this is what
 * makes sure it is still seen.
 *
 * @since 1.0.0
 */
export class CoreChatInputSubcommandErrorListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.ChatInputSubcommandError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: SubcommandPluginEvents.ChatInputSubcommandError,
		});
	}

	public run(error: unknown, payload: ChatInputSubcommandErrorPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error on chat input subcommand "${name}" at path "${location.full}"`,
			error,
		);
	}
}

void container.stores.loadPiece({
	name: "PluginChatInputSubcommandError",
	piece: CoreChatInputSubcommandErrorListener,
	store: "listeners",
});
