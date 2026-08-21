import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PermissionPreconditionContext,
	PreconditionResult,
} from "@types";
import {
	PermissionFlagsBits,
	PermissionsBitField,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type Message,
	type NewsChannel,
	type TextChannel,
} from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";
import { CoreClientPermissionsPrecondition } from "./clientPermissions.ts";

/**
 * Refuses a command when the person invoking it lacks the permissions the command declared they
 * need.
 *
 * Attached automatically by a command's `requiredUserPermissions` option, so it rarely has to be
 * named by hand.
 *
 * @since 1.0.0
 */
export class CoreUserPermissionsPrecondition extends AllFlowsPrecondition {
	/**
	 * What a user is treated as holding inside a DM.
	 *
	 * A DM has no permission overwrites to read, so the set is built by taking every permission and
	 * removing the handful that genuinely do not apply there. It is slightly wider than the set the
	 * bot gets, because a user may mention everyone and use external stickers in their own DM.
	 */
	private readonly dmChannelPermissions = new PermissionsBitField(
		~new PermissionsBitField([
			PermissionFlagsBits.AddReactions,
			PermissionFlagsBits.AttachFiles,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.ReadMessageHistory,
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.UseExternalEmojis,
			PermissionFlagsBits.ViewChannel,
			PermissionFlagsBits.UseExternalStickers,
			PermissionFlagsBits.MentionEveryone,
		]).bitfield & PermissionsBitField.All,
	).freeze();

	public messageRun(
		message: Message,
		_command: MessageCommand,
		context: PermissionPreconditionContext,
	): PreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();
		const channel = message.channel as TextChannel | NewsChannel;
		const available = message.guild
			? channel.permissionsFor(message.author)
			: this.dmChannelPermissions;

		return this.compare(required, available, "message");
	}

	public chatInputRun(
		interaction: ChatInputCommandInteraction,
		_command: ChatInputCommand,
		context: PermissionPreconditionContext,
	): PreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();
		const available = interaction.guildId
			? interaction.memberPermissions
			: this.dmChannelPermissions;

		return this.compare(required, available, "chat input");
	}

	public contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		_command: ContextMenuCommand,
		context: PermissionPreconditionContext,
	): PreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();
		const available = interaction.guildId
			? interaction.memberPermissions
			: this.dmChannelPermissions;

		return this.compare(required, available, "context menu");
	}

	/**
	 * Reports whichever of the required permissions the caller does not hold, named in plain English.
	 */
	private compare(
		requiredPermissions: PermissionsBitField,
		availablePermissions: PermissionsBitField | null,
		commandType: string,
	): PreconditionResult {
		if (!availablePermissions) {
			return this.error({
				identifier: Identifiers.PreconditionUserPermissionsNoPermissions,
				message: `I was unable to resolve the end-user's permissions in the ${commandType} command invocation channel.`,
			});
		}

		const missing = availablePermissions.missing(requiredPermissions);
		if (missing.length === 0) return this.ok();

		const names = missing
			.map(
				(permission) =>
					CoreClientPermissionsPrecondition.readablePermissions[permission],
			)
			.join(", ");

		return this.error({
			identifier: Identifiers.PreconditionUserPermissions,
			message: `You are missing the following permissions to run this command: ${names}`,
			context: { missing },
		});
	}
}

void container.stores.loadPiece({
	name: "UserPermissions",
	piece: CoreUserPermissionsPrecondition,
	store: "preconditions",
});
