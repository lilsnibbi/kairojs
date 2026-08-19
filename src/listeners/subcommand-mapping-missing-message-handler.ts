import type { Message } from "discord.js";
import type {
	MessageSubcommandAcceptedPayload,
	PieceLoaderContext,
	SubcommandMappingMethod,
} from "@types";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports a message subcommand mapping that matched but has no `messageRun` to route to.
 *
 * @since 1.0.0
 */
export class CoreSubcommandMappingMissingMessageHandlerListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.SubcommandMappingIsMissingMessageCommandHandler
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event:
				SubcommandPluginEvents.SubcommandMappingIsMissingMessageCommandHandler,
		});
	}

	public run(
		_message: Message,
		subcommand: SubcommandMappingMethod,
		payload: MessageSubcommandAcceptedPayload,
	) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered a missing mapping on message subcommand "${name}" at "${location.full}"`,
			subcommand,
		);
	}
}

void container.stores.loadPiece({
	name: "PluginSubcommandMappingIsMissingMessageCommandHandler",
	piece: CoreSubcommandMappingMissingMessageHandlerListener,
	store: "listeners",
});
