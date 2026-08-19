import type { AutocompleteCommand, PieceLoaderContext } from "@types";
import type { AutocompleteInteraction } from "discord.js";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Answers an autocomplete interaction, preferring the command's own `autocompleteRun` and falling
 * back to the interaction handlers.
 *
 * A command that supplies its own suggestions wins outright, because it is the more specific answer;
 * only when it has none does the interaction reach the handler store, where a shared handler can
 * serve several commands at once.
 *
 * @since 1.0.0
 */
export class CorePossibleAutocompleteInteractionListener extends Listener<
	"client",
	typeof Events.PossibleAutocompleteInteraction
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.PossibleAutocompleteInteraction,
		});
	}

	public async run(interaction: AutocompleteInteraction) {
		const { client, stores } = this.container;
		const commandStore = stores.get("commands");

		// Registered application commands are aliased by id as well as by name, so either resolves.
		const command =
			commandStore.get(interaction.commandId) ??
			commandStore.get(interaction.commandName);

		if (command?.autocompleteRun) {
			const payload = {
				command: command as AutocompleteCommand,
				context: {
					commandId: interaction.commandId,
					commandName: interaction.commandName,
				},
				interaction,
			};

			try {
				await command.autocompleteRun(interaction);
				client.emit(Events.CommandAutocompleteInteractionSuccess, payload);
			} catch (error) {
				client.emit(Events.CommandAutocompleteInteractionError, error, payload);
			}

			return;
		}

		await stores.get("interaction-handlers").run(interaction);
	}
}

void container.stores.loadPiece({
	name: "CorePossibleAutocompleteInteraction",
	piece: CorePossibleAutocompleteInteractionListener,
	store: "listeners",
});
