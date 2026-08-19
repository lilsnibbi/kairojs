import type { ChannelTypes, Nullish } from "@types";
import { isNullish } from "@utilities/utilities/index.ts";
import {
	PermissionFlagsBits,
	PermissionsBitField,
	type VoiceBasedChannel,
} from "discord.js";
import {
	isDMChannel,
	isGuildBasedChannel,
	isVoiceBasedChannel,
} from "./type-guards.ts";

const readMessagesPermissions = new PermissionsBitField([
	PermissionFlagsBits.ViewChannel,
]);

/**
 * Whether the client is allowed to read messages in the given channel.
 *
 * DMs always come back `true` — permission overwrites are a guild concept.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can read messages there.
 *
 * @since 1.0.0
 */
export function canReadMessages(channel: ChannelTypes | Nullish): boolean {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return true;

	return hasPermissions(channel, readMessagesPermissions);
}

const sendMessagesPermissions = new PermissionsBitField([
	readMessagesPermissions,
	PermissionFlagsBits.SendMessages,
]);

/**
 * Whether the client is allowed to send messages in the given channel.
 *
 * Threads are additionally rejected when discord.js reports them as not sendable, which covers
 * archived and locked threads.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can send messages there.
 *
 * @since 1.0.0
 */
export function canSendMessages(channel: ChannelTypes | Nullish): boolean {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return true;
	if (channel.isThread() && !channel.sendable) return false;

	return hasPermissions(channel, sendMessagesPermissions);
}

const sendEmbedsPermissions = new PermissionsBitField([
	sendMessagesPermissions,
	PermissionFlagsBits.EmbedLinks,
]);

/**
 * Whether the client is allowed to send embeds in the given channel.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can send embeds there.
 *
 * @since 1.0.0
 */
export function canSendEmbeds(channel: ChannelTypes | Nullish): boolean {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return true;
	if (channel.isThread() && !channel.sendable) return false;

	return hasPermissions(channel, sendEmbedsPermissions);
}

const sendAttachmentsPermissions = new PermissionsBitField([
	sendMessagesPermissions,
	PermissionFlagsBits.AttachFiles,
]);

/**
 * Whether the client is allowed to attach files in the given channel.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can send attachments there.
 *
 * @since 1.0.0
 */
export function canSendAttachments(channel: ChannelTypes | Nullish): boolean {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return true;
	if (channel.isThread() && !channel.sendable) return false;

	return hasPermissions(channel, sendAttachmentsPermissions);
}

const reactPermissions = new PermissionsBitField([
	sendMessagesPermissions,
	PermissionFlagsBits.ReadMessageHistory,
	PermissionFlagsBits.AddReactions,
]);

/**
 * Whether the client is allowed to react to messages in the given channel.
 *
 * Archived threads are rejected, since nothing in them can be reacted to any more.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can react there.
 *
 * @since 1.0.0
 */
export function canReact(channel: ChannelTypes | Nullish) {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return true;
	if (channel.isThread() && channel.archived) return false;

	return hasPermissions(channel, reactPermissions);
}

const removeAllReactionsPermissions = new PermissionsBitField([
	readMessagesPermissions,
	PermissionFlagsBits.ReadMessageHistory,
	PermissionFlagsBits.ManageMessages,
]);

/**
 * Whether the client is allowed to clear other people's reactions in the given channel.
 *
 * DMs come back `false` here rather than `true`: nobody holds Manage Messages in a DM, so the bulk
 * removal endpoint is simply unavailable.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can remove all reactions there.
 *
 * @since 1.0.0
 */
export function canRemoveAllReactions(channel: ChannelTypes | Nullish) {
	if (isNullish(channel)) return false;
	if (isDMChannel(channel)) return false;

	return hasPermissions(channel, removeAllReactionsPermissions);
}

const joinVoiceChannelPermissions = new PermissionsBitField([
	PermissionFlagsBits.Connect,
]);

/**
 * Whether the client can join the given voice-based channel — it must be a voice channel, it must
 * not already be full, and the client must hold Connect.
 *
 * @param channel The channel whose permissions to inspect.
 * @returns Whether the client can join.
 *
 * @since 1.0.0
 */
export function canJoinVoiceChannel(
	channel: VoiceBasedChannel | Nullish,
): boolean {
	if (isNullish(channel)) return false;
	if (!isVoiceBasedChannel(channel)) return false;
	if (channel.userLimit >= channel.members.size) return false;

	return hasPermissions(channel, joinVoiceChannelPermissions);
}

/**
 * Resolves the client's own permissions in a guild channel and tests them against the required set.
 *
 * Channels that are not guild-based short-circuit to `true`, because permissions do not apply
 * outside a guild.
 */
function hasPermissions(
	channel: ChannelTypes,
	requiredPermissions: PermissionsBitField,
) {
	if (!isGuildBasedChannel(channel)) {
		return true;
	}

	const { me } = channel.guild.members;
	if (!me) return false;

	const permissions = channel.permissionsFor(me);
	if (!permissions) return false;

	return permissions.has(requiredPermissions);
}
