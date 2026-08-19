import type {
	APIApplicationCommandInteractionDataBasicOption,
	ModalSubmitComponent,
} from "discord.js";

/**
 * The `type` discriminant of any non-subcommand, non-group application command option.
 *
 * @since 1.0.0
 */
export type BasicApplicationCommandOptionType =
	APIApplicationCommandInteractionDataBasicOption["type"];

/**
 * Maps each {@link BasicApplicationCommandOptionType} to the option shape carrying that type.
 *
 * @since 1.0.0
 */
export type TypeToOptionMap = {
	[Option in BasicApplicationCommandOptionType]: APIApplicationCommandInteractionDataBasicOption & {
		type: Option;
	};
};

/**
 * The `type` discriminant of any component submitted through a modal.
 *
 * @since 1.0.0
 */
export type ModalComponentType = ModalSubmitComponent["type"];

/**
 * Maps each {@link ModalComponentType} to the component shape carrying that type.
 *
 * @since 1.0.0
 */
export type TypeToModalComponentMap = {
	[Component in ModalComponentType]: ModalSubmitComponent & { type: Component };
};
