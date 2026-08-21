import type { Message } from "discord.js";
import type {
	MessageSubcommandNoMatchContext,
	PieceLoaderContext,
} from "@types";
import type { Args } from "@/parsers/args.ts";
import { SubcommandPluginEvents } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports a message subcommand that matched neither a mapping nor a default.
 *
 * @since 1.0.0
 */
export class CoreMessageSubcommandNoMatchListener extends Listener<
	"client",
	typeof SubcommandPluginEvents.MessageSubcommandNoMatch
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: SubcommandPluginEvents.MessageSubcommandNoMatch,
		});
	}

	public run(
		_message: Message,
		_args: Args,
		context: MessageSubcommandNoMatchContext,
	) {
		this.container.logger.error(context.message);
	}
}

void container.stores.loadPiece({
	name: "PluginMessageSubcommandNoMatch",
	piece: CoreMessageSubcommandNoMatchListener,
	store: "listeners",
});
