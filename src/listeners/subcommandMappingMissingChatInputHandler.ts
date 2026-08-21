import type { ChatInputCommandInteraction } from "discord.js";
import type {
	ChatInputSubcommandAcceptedPayload,
	PieceLoaderContext,
	SubcommandMappingMethod,
} from "@types";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports a chat input subcommand mapping that matched but has no `chatInputRun` to route to.
 *
 * The mapping itself is logged alongside the command, since the omission is in the mapping and
 * naming the command alone would not say which entry is at fault.
 *
 * @since 1.0.0
 */
export class CoreSubcommandMappingMissingChatInputHandlerListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.SubcommandMappingIsMissingChatInputCommandHandler
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event:
				SubcommandPluginEvents.SubcommandMappingIsMissingChatInputCommandHandler,
		});
	}

	public run(
		_interaction: ChatInputCommandInteraction,
		subcommand: SubcommandMappingMethod,
		payload: ChatInputSubcommandAcceptedPayload,
	) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered a missing mapping on chat input subcommand "${name}" at "${location.full}"`,
			subcommand,
		);
	}
}

void container.stores.loadPiece({
	name: "PluginSubcommandMappingIsMissingChatInputCommandHandler",
	piece: CoreSubcommandMappingMissingChatInputHandlerListener,
	store: "listeners",
});
