import type { ChatInputCommand, PieceLoaderContext } from "@types";
import type { ChatInputCommandInteraction } from "discord.js";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Resolves a slash command interaction to the command that owns it and moves it on to the
 * precondition stage.
 *
 * Neither dead end is treated as an error: Discord can still hold a registration for a command the
 * bot no longer loads, and a command may deliberately implement only some entry points. Both are
 * reported as their own events so a bot can respond to them however it likes.
 *
 * @since 1.0.0
 */
export class CorePossibleChatInputCommandListener extends Listener<
	"client",
	typeof Events.PossibleChatInputCommand
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PossibleChatInputCommand });
	}

	public run(interaction: ChatInputCommandInteraction) {
		const { client, stores } = this.container;
		const commandStore = stores.get("commands");
		const context = {
			commandId: interaction.commandId,
			commandName: interaction.commandName,
		};

		const command =
			commandStore.get(interaction.commandId) ??
			commandStore.get(interaction.commandName);
		if (!command) {
			client.emit(Events.UnknownChatInputCommand, { interaction, context });
			return;
		}

		if (!command.chatInputRun) {
			client.emit(Events.CommandDoesNotHaveChatInputCommandHandler, {
				command,
				interaction,
				context,
			});
			return;
		}

		client.emit(Events.PreChatInputCommandRun, {
			command: command as ChatInputCommand,
			context,
			interaction,
		});
	}
}

void container.stores.loadPiece({
	name: "CorePossibleChatInputCommand",
	piece: CorePossibleChatInputCommandListener,
	store: "listeners",
});
