import { ApplicationCommandType } from "discord.js";
import type {
	APIContextMenuInteraction,
	APIInteractionDataResolvedGuildMember,
	APIMessage,
	APIMessageApplicationCommandInteractionDataResolved,
	APIUser,
	APIUserInteractionDataResolved,
} from "discord.js";
import type { RequiredIf } from "@types";

/**
 * Resolves the target of a raw context-menu interaction — the user or message the command was
 * invoked on — from the raw gateway/API payload instead of a hydrated `Interaction` instance.
 *
 * @since 1.0.0
 */
export class ContextMenuInteractionOptionResolver {
	/**
	 * The raw interaction this resolver was built from.
	 */
	readonly #interaction: APIContextMenuInteraction;

	/**
	 * The resolved data (the targeted user, member or message) attached to the interaction.
	 */
	readonly #resolved:
		| APIMessageApplicationCommandInteractionDataResolved
		| APIUserInteractionDataResolved
		| null;

	/**
	 * @param interaction The raw context-menu interaction to resolve a target from.
	 */
	public constructor(interaction: APIContextMenuInteraction) {
		this.#interaction = interaction;
		this.#resolved =
			"resolved" in interaction.data
				? (interaction.data.resolved ?? null)
				: null;
	}

	/**
	 * Returns the targeted user.
	 *
	 * @throws If this resolver was not built from a user context-menu interaction.
	 */
	public getTargetUser(): APIUser {
		if (this.#interaction.data.type !== ApplicationCommandType.User) {
			throw new Error(
				"This method can only be used on user context menu interactions",
			);
		}

		return (this.#resolved as APIUserInteractionDataResolved).users[
			this.#interaction.data.target_id
		]!;
	}

	/**
	 * Returns the targeted user's guild member data.
	 *
	 * @param required Throws if member data is not present. Defaults to `false`.
	 *
	 * @throws If this resolver was not built from a user context-menu interaction.
	 */
	public getTargetMember<Required extends boolean = false>(
		required?: Required,
	): RequiredIf<Required, APIInteractionDataResolvedGuildMember>;
	public getTargetMember(
		required = false,
	): APIInteractionDataResolvedGuildMember | null {
		if (this.#interaction.data.type !== ApplicationCommandType.User) {
			throw new Error(
				"This method can only be used on user context menu interactions",
			);
		}

		const member =
			(this.#resolved as APIUserInteractionDataResolved).members?.[
				this.#interaction.data.target_id
			] ?? null;

		if (!member && required) {
			throw new Error("Member data is not present");
		}

		return member;
	}

	/**
	 * Returns the targeted message.
	 *
	 * @throws If this resolver was not built from a message context-menu interaction.
	 */
	public getTargetMessage(): APIMessage {
		if (this.#interaction.data.type !== ApplicationCommandType.Message) {
			throw new Error(
				"This method can only be used on message context menu interactions",
			);
		}

		return (
			this.#resolved as APIMessageApplicationCommandInteractionDataResolved
		).messages[this.#interaction.data.target_id]!;
	}
}
