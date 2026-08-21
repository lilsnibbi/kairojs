import type { ChatInputCommandInteraction } from "discord.js";
import type {
	ChatInputSubcommandNoMatchContext,
	PieceLoaderContext,
} from "@types";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports a chat input subcommand that matched no mapping.
 *
 * Reaching this means the command's registered application command and its `subcommands` list have
 * drifted apart, so the message names both the command and the file it came from.
 *
 * @since 1.0.0
 */
export class CoreChatInputSubcommandNoMatchListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.ChatInputSubcommandNoMatch
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: SubcommandPluginEvents.ChatInputSubcommandNoMatch,
		});
	}

	public run(
		_interaction: ChatInputCommandInteraction,
		context: ChatInputSubcommandNoMatchContext,
	) {
		this.container.logger.error(context.message);
	}
}

void container.stores.loadPiece({
	name: "PluginChatInputSubcommandNoMatch",
	piece: CoreChatInputSubcommandNoMatchListener,
	store: "listeners",
});
