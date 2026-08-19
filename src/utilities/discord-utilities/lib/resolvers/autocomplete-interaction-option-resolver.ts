import { ApplicationCommandOptionType, InteractionType } from "discord.js";
import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteractionDataIntegerOption,
	APIApplicationCommandInteractionDataNumberOption,
	APIApplicationCommandInteractionDataOption,
	APIApplicationCommandInteractionDataStringOption,
} from "discord.js";
import type { RequiredIf } from "@types";

/**
 * Resolves the options of a raw autocomplete interaction, hoisting past any subcommand or
 * subcommand group so callers never have to walk the option tree by hand.
 *
 * Mirrors the ergonomics of discord.js's own interaction option resolver, but works directly
 * against the raw gateway/API payload instead of a hydrated `Interaction` instance.
 *
 * @since 1.0.0
 */
export class AutocompleteInteractionOptionResolver {
	/**
	 * The raw interaction this resolver was built from.
	 */
	readonly #interaction: APIApplicationCommandAutocompleteInteraction;

	/**
	 * The options attached directly to the interaction, before hoisting.
	 */
	readonly #data: APIApplicationCommandInteractionDataOption[] | null;

	/**
	 * The options a caller actually queries against — the options of the innermost subcommand when
	 * one was selected, otherwise {@link AutocompleteInteractionOptionResolver.#data}.
	 */
	#hoistedOptions: APIApplicationCommandInteractionDataOption[] | null;

	/**
	 * The selected subcommand group's name, if any.
	 */
	#group: string | null = null;

	/**
	 * The selected subcommand's name, if any.
	 */
	#subcommand: string | null = null;

	/**
	 * @param interaction The raw autocomplete interaction to resolve options from.
	 */
	public constructor(
		interaction: APIApplicationCommandAutocompleteInteraction,
	) {
		this.#interaction = interaction;

		this.#data =
			"options" in interaction.data ? (interaction.data.options ?? null) : null;
		this.#hoistedOptions = this.#data;

		// Hoist past a subcommand group, if one was selected.
		if (
			this.#hoistedOptions?.[0]?.type ===
			ApplicationCommandOptionType.SubcommandGroup
		) {
			this.#group = this.#hoistedOptions[0].name;
			this.#hoistedOptions = this.#hoistedOptions[0].options ?? [];
		}

		// Hoist past a subcommand, if one was selected.
		if (
			this.#hoistedOptions?.[0]?.type ===
			ApplicationCommandOptionType.Subcommand
		) {
			this.#subcommand = this.#hoistedOptions[0].name;
			this.#hoistedOptions = this.#hoistedOptions[0].options ?? [];
		}
	}

	/**
	 * Returns the selected subcommand's name.
	 *
	 * @param required Throws if no subcommand was selected. Defaults to `true`.
	 */
	public getSubcommand<Required extends boolean = false>(
		required?: Required,
	): RequiredIf<Required, string>;
	public getSubcommand(required = true): string | null {
		if (required && !this.#subcommand) {
			throw new Error("A subcommand was not selected");
		}

		return this.#subcommand;
	}

	/**
	 * Returns the selected subcommand group's name.
	 *
	 * @param required Throws if no subcommand group was selected. Defaults to `true`.
	 */
	public getSubcommandGroup<Required extends boolean = false>(
		required?: Required,
	): RequiredIf<Required, string>;
	public getSubcommandGroup(required = true): string | null {
		if (required && !this.#group) {
			throw new Error("A subcommand group was not selected");
		}

		return this.#group;
	}

	/**
	 * Returns the option the user is currently typing into.
	 *
	 * @throws If this resolver was not built from an autocomplete interaction, or — which should
	 * never happen given the interaction type is already checked — no option is focused.
	 */
	public getFocusedOption() {
		if (
			this.#interaction.type !== InteractionType.ApplicationCommandAutocomplete
		) {
			throw new Error(
				"This method can only be used on autocomplete interactions",
			);
		}

		const focusedOption = this.#hoistedOptions?.find(
			(option) => "focused" in option && option.focused,
		) as
			| APIApplicationCommandInteractionDataStringOption
			| APIApplicationCommandInteractionDataIntegerOption
			| APIApplicationCommandInteractionDataNumberOption
			| undefined;

		if (!focusedOption) {
			throw new Error("No focused option for autocomplete interaction");
		}

		const { focused, ...option } = focusedOption;

		return option;
	}
}
