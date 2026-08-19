import type {
	AsyncPreconditionResult,
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PermissionPreconditionContext,
	PreconditionResult,
} from "@types";
import {
	PermissionFlagsBits,
	PermissionsBitField,
	type BaseInteraction,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type Message,
	type PermissionsString,
	type TextBasedChannel,
} from "discord.js";
import { isNullish } from "@utilities/utilities/index.ts";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";

/**
 * Refuses a command when the bot itself lacks the permissions the command declared it needs.
 *
 * Attached automatically by a command's `requiredClientPermissions` option, so it rarely has to be
 * named by hand.
 *
 * @since 1.0.0
 */
export class CoreClientPermissionsPrecondition extends AllFlowsPrecondition {
	/**
	 * What the bot is treated as holding inside a DM.
	 *
	 * A DM has no permission overwrites to read, so the set is built by taking every permission and
	 * removing the handful that genuinely do not apply there.
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
		]).bitfield & PermissionsBitField.All,
	).freeze();

	public async messageRun(
		message: Message,
		_command: MessageCommand,
		context: PermissionPreconditionContext,
	): AsyncPreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();

		if (!message.client.id) {
			return this.error({
				identifier: Identifiers.PreconditionClientPermissionsNoClient,
				message: "There was no client to validate the permissions for.",
			});
		}

		const available = await this.resolveChannelPermissions(
			message.channel,
			message,
		);

		return this.compare(required, available, "message");
	}

	public async chatInputRun(
		interaction: ChatInputCommandInteraction,
		_command: ChatInputCommand,
		context: PermissionPreconditionContext,
	): AsyncPreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();
		const available = await this.resolveInteractionPermissions(interaction);

		return this.compare(required, available, "chat input");
	}

	public async contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		_command: ContextMenuCommand,
		context: PermissionPreconditionContext,
	): AsyncPreconditionResult {
		const required = context.permissions ?? new PermissionsBitField();
		const available = await this.resolveInteractionPermissions(interaction);

		return this.compare(required, available, "context menu");
	}

	/**
	 * Works out what the bot may do in a given channel.
	 *
	 * The application id is preferred over a member lookup because it needs no fetch, but a
	 * user-installed application has no member in the guild and no overwrites keyed to it, so a
	 * fetch of the bot's own member is the fallback.
	 */
	private async resolveChannelPermissions(
		channel: TextBasedChannel,
		messageOrInteraction: Message | BaseInteraction,
	) {
		if (!messageOrInteraction.inGuild() || channel.isDMBased()) {
			return this.dmChannelPermissions;
		}

		if (isNullish(messageOrInteraction.applicationId)) {
			const me = await messageOrInteraction.guild?.members.fetchMe();
			return me ? channel.permissionsFor(me) : this.dmChannelPermissions;
		}

		const byApplication = channel.permissionsFor(
			messageOrInteraction.applicationId,
		);
		if (!isNullish(byApplication)) return byApplication;

		const me = await messageOrInteraction.guild?.members.fetchMe();
		return me ? channel.permissionsFor(me) : this.dmChannelPermissions;
	}

	/**
	 * Works out what the bot may do where an interaction was invoked.
	 *
	 * An interaction the bot cannot see a channel for still carries `appPermissions`, which Discord
	 * computes on its side and is the only source available in that case.
	 */
	private async resolveInteractionPermissions(
		interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
	) {
		if (!interaction.channel) return interaction.appPermissions;
		if (interaction.channel.isDMBased()) return this.dmChannelPermissions;

		const channel = await this.fetchChannelFromInteraction(interaction);
		return this.resolveChannelPermissions(channel, interaction);
	}

	/**
	 * Reports whichever of the required permissions are not held, named in plain English.
	 */
	private compare(
		requiredPermissions: PermissionsBitField,
		availablePermissions: PermissionsBitField | null,
		commandType: string,
	): PreconditionResult {
		if (!availablePermissions) {
			return this.error({
				identifier: Identifiers.PreconditionClientPermissionsNoPermissions,
				message: `I was unable to resolve my permissions in the ${commandType} command invocation channel.`,
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
			identifier: Identifiers.PreconditionClientPermissions,
			message: `I am missing the following permissions to run this command: ${names}`,
			context: { missing },
		});
	}

	/**
	 * Every permission flag spelled the way Discord's own interface spells it, so a denial message
	 * names something a user can actually go and find in the channel settings.
	 */
	public static readonly readablePermissions: Record<
		PermissionsString,
		string
	> = {
		AddReactions: "Add Reactions",
		Administrator: "Administrator",
		AttachFiles: "Attach Files",
		BanMembers: "Ban Members",
		BypassSlowmode: "Bypass Slowmode",
		ChangeNickname: "Change Nickname",
		Connect: "Connect",
		CreateEvents: "Create Events",
		CreateGuildExpressions: "Create Expressions",
		CreateInstantInvite: "Create Instant Invite",
		CreatePrivateThreads: "Create Private Threads",
		CreatePublicThreads: "Create Public Threads",
		DeafenMembers: "Deafen Members",
		EmbedLinks: "Embed Links",
		KickMembers: "Kick Members",
		ManageChannels: "Manage Channels",
		ManageEmojisAndStickers: "Manage Emojis and Stickers",
		ManageEvents: "Manage Events",
		ManageGuild: "Manage Server",
		ManageGuildExpressions: "Manage Guild Expressions",
		ManageMessages: "Manage Messages",
		ManageNicknames: "Manage Nicknames",
		ManageRoles: "Manage Roles",
		ManageThreads: "Manage Threads",
		ManageWebhooks: "Manage Webhooks",
		MentionEveryone: "Mention Everyone",
		ModerateMembers: "Moderate Members",
		MoveMembers: "Move Members",
		MuteMembers: "Mute Members",
		PinMessages: "Pin Messages",
		PrioritySpeaker: "Priority Speaker",
		ReadMessageHistory: "Read Message History",
		RequestToSpeak: "Request to Speak",
		SendMessages: "Send Messages",
		SendMessagesInThreads: "Send Messages in Threads",
		SendPolls: "Create Polls",
		SendTTSMessages: "Send TTS Messages",
		SendVoiceMessages: "Send Voice Messages",
		SetVoiceChannelStatus: "Set Voice Channel Status",
		Speak: "Speak",
		Stream: "Stream",
		UseApplicationCommands: "Use Application Commands",
		UseEmbeddedActivities: "Start Activities",
		UseExternalApps: "Use External Apps",
		UseExternalEmojis: "Use External Emojis",
		UseExternalSounds: "Use External Sounds",
		UseExternalStickers: "Use External Stickers",
		UseSoundboard: "Use Soundboard",
		UseVAD: "Use Voice Activity",
		ViewAuditLog: "View Audit Log",
		ViewChannel: "Read Messages",
		ViewCreatorMonetizationAnalytics: "View Creator Monetization Analytics",
		ViewGuildInsights: "View Guild Insights",
	};
}

void container.stores.loadPiece({
	name: "ClientPermissions",
	piece: CoreClientPermissionsPrecondition,
	store: "preconditions",
});
