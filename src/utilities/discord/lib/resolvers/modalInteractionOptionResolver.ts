import { ComponentType } from "discord.js";
import type {
	APIAttachment,
	APIInteractionDataResolved,
	APIInteractionDataResolvedChannel,
	APIInteractionDataResolvedGuildMember,
	APIModalSubmitInteraction,
	APIRole,
	APIUser,
	ModalSubmitComponent,
} from "discord.js";
import type { ModalComponentType, TypeToModalComponentMap } from "@types";

/**
 * Resolves the components submitted through a raw modal interaction, flattening past action rows
 * and labels so every component can be looked up directly by its custom ID.
 *
 * @since 1.0.0
 */
export class ModalInteractionOptionResolver {
	/**
	 * The resolved data (users, members, channels, roles, attachments) referenced by the components.
	 */
	readonly #resolved: APIInteractionDataResolved | null;

	/**
	 * Every submitted component, flattened past action rows and labels.
	 */
	readonly #hoistedComponents: ModalSubmitComponent[];

	/**
	 * @param interaction The raw modal interaction to resolve components from.
	 */
	public constructor(interaction: APIModalSubmitInteraction) {
		this.#resolved =
			"resolved" in interaction.data
				? (interaction.data.resolved ?? null)
				: null;

		this.#hoistedComponents = interaction.data.components.flatMap(
			(component) => {
				// Action rows carry their children directly.
				if ("components" in component) {
					return component.components;
				}

				// Labels wrap a single component.
				if ("component" in component) {
					return [component.component];
				}

				// Anything else is not a component this resolver understands.
				return [];
			},
		);
	}

	/**
	 * Returns a raw component by its custom ID.
	 *
	 * @param customId The component's custom ID.
	 *
	 * @throws If no component with that custom ID was submitted.
	 */
	public get(customId: string): ModalSubmitComponent {
		const component = this.#hoistedComponents.find(
			(candidate) => candidate.custom_id === customId,
		);
		if (!component) {
			throw new Error(`Component with custom ID "${customId}" not found.`);
		}

		return component;
	}

	/**
	 * Returns a text input component's value.
	 *
	 * @param customId The component's custom ID.
	 */
	public getTextInput(customId: string): string {
		return this.#getTyped(customId, ComponentType.TextInput).value;
	}

	/**
	 * Returns a string select component's selected values.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedStrings(customId: string): string[] {
		return this.#getTyped(customId, ComponentType.StringSelect).values;
	}

	/**
	 * Returns a user select component's resolved users.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedUsers(customId: string): APIUser[] {
		const component = this.#getTyped(customId, ComponentType.UserSelect);
		return component.values.map((userId) => this.#resolved!.users![userId]!);
	}

	/**
	 * Returns a role select component's resolved roles.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedRoles(customId: string): APIRole[] {
		const component = this.#getTyped(customId, ComponentType.RoleSelect);
		return component.values.map((roleId) => this.#resolved!.roles![roleId]!);
	}

	/**
	 * Returns a channel select component's resolved channels.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedChannels(
		customId: string,
	): APIInteractionDataResolvedChannel[] {
		const component = this.#getTyped(customId, ComponentType.ChannelSelect);
		return component.values.map(
			(channelId) => this.#resolved!.channels![channelId]!,
		);
	}

	/**
	 * Returns a user select component's resolved guild members.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedMembers(
		customId: string,
	): APIInteractionDataResolvedGuildMember[] {
		const component = this.#getTyped(customId, ComponentType.UserSelect);
		return component.values.map(
			(memberId) => this.#resolved!.members![memberId]!,
		);
	}

	/**
	 * Returns a mentionable select component's resolved users and roles.
	 *
	 * @param customId The component's custom ID.
	 */
	public getSelectedMentionables(customId: string): (APIUser | APIRole)[] {
		const component = this.#getTyped(customId, ComponentType.MentionableSelect);
		return component.values.map((id) => {
			if (this.#resolved!.users && id in this.#resolved!.users) {
				return this.#resolved!.users![id]!;
			}

			return this.#resolved!.roles![id]!;
		});
	}

	/**
	 * Returns a file upload component's resolved attachments.
	 *
	 * @param customId The component's custom ID.
	 */
	public getAttachments(customId: string): APIAttachment[] {
		const component = this.#getTyped(customId, ComponentType.FileUpload);
		return component.values.map((id) => this.#resolved!.attachments![id]!);
	}

	/**
	 * Looks up a component by custom ID and asserts it carries the expected type.
	 */
	#getTyped<AllowedType extends ModalComponentType>(
		customId: string,
		allowedType: AllowedType,
	): TypeToModalComponentMap[AllowedType] {
		const component = this.get(customId);
		if (component.type !== allowedType) {
			throw new Error(
				`Component with custom ID "${customId}" is not one of the allowed type: ${allowedType}.`,
			);
		}

		return component as TypeToModalComponentMap[AllowedType];
	}
}
