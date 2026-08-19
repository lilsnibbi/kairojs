import type { PieceLoaderContext } from "@types";
import type { Interaction } from "discord.js";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * The single entry point for everything Discord sends as an interaction.
 *
 * Rather than handling any of it here, this fans each kind out to its own framework event, so the
 * chat input, context menu and autocomplete chains stay independent and a bot can listen to exactly
 * the stage it cares about. Components and modals have no command chain and go straight to the
 * interaction handlers.
 *
 * @since 1.0.0
 */
export class CoreInteractionCreateListener extends Listener<
	"client",
	typeof Events.InteractionCreate
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.InteractionCreate });
	}

	public async run(interaction: Interaction) {
		if (interaction.isChatInputCommand()) {
			this.container.client.emit(Events.PossibleChatInputCommand, interaction);
		} else if (interaction.isContextMenuCommand()) {
			this.container.client.emit(
				Events.PossibleContextMenuCommand,
				interaction,
			);
		} else if (interaction.isAutocomplete()) {
			this.container.client.emit(
				Events.PossibleAutocompleteInteraction,
				interaction,
			);
		} else if (
			interaction.isMessageComponent() ||
			interaction.isModalSubmit()
		) {
			await this.container.stores.get("interaction-handlers").run(interaction);
		} else {
			this.container.logger.warn(
				`[Kairo ${this.location.name}] Unhandled interaction type: ${interaction.constructor.name}`,
			);
		}
	}
}

void container.stores.loadPiece({
	name: "CoreInteractionCreate",
	piece: CoreInteractionCreateListener,
	store: "listeners",
});
