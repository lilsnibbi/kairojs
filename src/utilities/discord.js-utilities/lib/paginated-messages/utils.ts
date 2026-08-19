import type {
	PaginatedMessageAction,
	PaginatedMessageActionButton,
	PaginatedMessageActionChannelMenu,
	PaginatedMessageActionLink,
	PaginatedMessageActionMentionableMenu,
	PaginatedMessageActionRoleMenu,
	PaginatedMessageActionStringMenu,
	PaginatedMessageActionUserMenu,
	PaginatedMessageComponentUnion,
	SafeReplyToInteractionParameters,
} from "@types";
import { chunk, partition } from "@utilities/utilities/index.ts";
import {
	ActionRowBuilder,
	type ButtonBuilder,
	ButtonStyle,
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponent,
	type APIComponentInMessageActionRow,
	type ActionRowComponentOptions,
	type ButtonComponentData,
	type ChannelSelectMenuComponentData,
	type MentionableSelectMenuComponentData,
	type MessageActionRowComponentBuilder,
	type RoleSelectMenuComponentData,
	type StringSelectMenuComponentData,
	type UserSelectMenuComponentData,
} from "discord.js";
import {
	isAnyInteractableInteraction,
	isMessageInstance,
} from "../type-guards.ts";

/**
 * Whether an action is something Discord will send an interaction for — that is, anything but a
 * link button.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function actionIsButtonOrMenu(
	action: PaginatedMessageAction,
): action is Exclude<PaginatedMessageAction, PaginatedMessageActionLink> {
	return (
		action.type === ComponentType.Button ||
		action.type === ComponentType.StringSelect ||
		action.type === ComponentType.UserSelect ||
		action.type === ComponentType.RoleSelect ||
		action.type === ComponentType.MentionableSelect ||
		action.type === ComponentType.ChannelSelect
	);
}

/**
 * Whether an action is a button that merely opens a URL.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function actionIsLinkButton(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionLink {
	return (
		action.type === ComponentType.Button && action.style === ButtonStyle.Link
	);
}

/**
 * Whether a piece of component data describes a button.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageButtonInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is ButtonComponentData {
	return interaction.type === ComponentType.Button;
}

/**
 * Whether a piece of component data describes a string select menu.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageStringSelectInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is StringSelectMenuComponentData {
	return interaction.type === ComponentType.StringSelect;
}

/**
 * Whether a piece of component data describes a user select menu.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageUserSelectInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is UserSelectMenuComponentData {
	return interaction.type === ComponentType.UserSelect;
}

/**
 * Whether a piece of component data describes a role select menu.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageRoleSelectInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is RoleSelectMenuComponentData {
	return interaction.type === ComponentType.RoleSelect;
}

/**
 * Whether a piece of component data describes a mentionable select menu.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageMentionableSelectInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is MentionableSelectMenuComponentData {
	return interaction.type === ComponentType.MentionableSelect;
}

/**
 * Whether a piece of component data describes a channel select menu.
 *
 * @param interaction The component data to inspect.
 *
 * @since 1.0.0
 */
export function isMessageChannelSelectInteractionData(
	interaction: ActionRowComponentOptions,
): interaction is ChannelSelectMenuComponentData {
	return interaction.type === ComponentType.ChannelSelect;
}

/**
 * Whether a builder taken from an action row is a button builder.
 *
 * @param component The builder to inspect.
 *
 * @since 1.0.0
 */
export function isButtonComponentBuilder(
	component: MessageActionRowComponentBuilder,
): component is ButtonBuilder {
	return component.data.type === ComponentType.Button;
}

/**
 * Whether an action is a clickable button, as opposed to a link button.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionButton(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionButton {
	return (
		action.type === ComponentType.Button && action.style !== ButtonStyle.Link
	);
}

/**
 * Whether an action is a link button.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionLink(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionLink {
	return (
		action.type === ComponentType.Button && action.style === ButtonStyle.Link
	);
}

/**
 * Whether an action is a string select menu.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionStringMenu(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionStringMenu {
	return action.type === ComponentType.StringSelect;
}

/**
 * Whether an action is a user select menu.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionUserMenu(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionUserMenu {
	return action.type === ComponentType.UserSelect;
}

/**
 * Whether an action is a role select menu.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionRoleMenu(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionRoleMenu {
	return action.type === ComponentType.RoleSelect;
}

/**
 * Whether an action is a mentionable select menu.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionMentionableMenu(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionMentionableMenu {
	return action.type === ComponentType.MentionableSelect;
}

/**
 * Whether an action is a channel select menu.
 *
 * @param action The action to inspect.
 *
 * @since 1.0.0
 */
export function isActionChannelMenu(
	action: PaginatedMessageAction,
): action is PaginatedMessageActionChannelMenu {
	return action.type === ComponentType.ChannelSelect;
}

/**
 * Lays a flat list of components out into action rows the way Discord requires.
 *
 * Select menus each take a row to themselves, buttons are packed five to a row, and link buttons
 * are kept apart from clickable ones so they end up together at the bottom of the message.
 *
 * @param components The components to arrange.
 * @returns Serialised action rows, ready to hand to discord.js.
 *
 * @since 1.0.0
 */
export function createPartitionedMessageRow(
	components: MessageActionRowComponentBuilder[],
): PaginatedMessageComponentUnion[] {
	const [buttons, selectMenus] = partition(
		components,
		isButtonComponentBuilder,
	);
	const [actionButtons, linkButtons] = partition(
		buttons,
		(value) =>
			(value.data as Partial<APIButtonComponent>).style !== ButtonStyle.Link,
	);

	const actionButtonRows = chunk(actionButtons, 5).map((componentsChunk) =>
		new ActionRowBuilder() //
			.setComponents(componentsChunk),
	);

	const selectMenuRows = selectMenus.map((component) =>
		new ActionRowBuilder() //
			.setComponents(component),
	);

	const linkButtonRows = chunk(linkButtons, 5).map((componentsChunk) =>
		new ActionRowBuilder() //
			.setComponents(componentsChunk),
	);

	return [...actionButtonRows, ...selectMenuRows, ...linkButtonRows].map(
		(actionRow) => actionRow.toJSON(),
	) as APIActionRowComponent<APIComponentInMessageActionRow>[];
}

/**
 * Responds to whatever it is handed, picking the one method Discord will actually accept.
 *
 * An interaction that has already been replied to or deferred gets its reply edited; a component
 * interaction is updated in place; anything else is replied to fresh. Plain messages fall through
 * to whichever method the caller named.
 *
 * @param parameters One payload per possible destination, plus the target itself.
 *
 * @since 1.0.0
 */
export async function safelyReplyToInteraction<T extends "edit" | "reply">(
	parameters: SafeReplyToInteractionParameters<T>,
) {
	if (isAnyInteractableInteraction(parameters.messageOrInteraction)) {
		if (
			parameters.messageOrInteraction.replied ||
			parameters.messageOrInteraction.deferred
		) {
			await parameters.messageOrInteraction.editReply(
				parameters.interactionEditReplyContent,
			);
		} else if (parameters.messageOrInteraction.isMessageComponent()) {
			await parameters.messageOrInteraction.update(
				parameters.componentUpdateContent,
			);
		} else {
			await parameters.messageOrInteraction.reply(
				parameters.interactionReplyContent,
			);
		}
	} else if (
		parameters.messageMethodContent &&
		parameters.messageMethod &&
		isMessageInstance(parameters.messageOrInteraction)
	) {
		await parameters.messageOrInteraction[parameters.messageMethod](
			parameters.messageMethodContent as any,
		);
	}
}
