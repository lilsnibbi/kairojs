import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@/structures/interaction-handler.ts";
import type { PieceLoaderContext } from "@types";
import type { ButtonInteraction } from "discord.js";
import { none, some } from "@utilities/result/index.ts";

/** Handles button presses whose custom id this handler claims. */
export class ButtonHandler extends InteractionHandler {
	public constructor(context: PieceLoaderContext<"interaction-handlers">) {
		super(context, { interactionHandlerType: InteractionHandlerTypes.Button });
	}

	public override parse(interaction: ButtonInteraction) {
		return interaction.customId.startsWith("example:")
			? some(interaction.customId.slice("example:".length))
			: none;
	}

	public run(interaction: ButtonInteraction, parsed: string) {
		return interaction.reply(`Button ${parsed} pressed.`);
	}
}
