import type {
	AnyInteractableInteraction,
	ChannelTypes,
	GuildTextBasedChannelTypes,
	NonThreadGuildTextBasedChannelTypes,
	Nullish,
	TextBasedChannelTypes,
} from "@types";
import {
	isNullish,
	isNullishOrEmpty,
	isNullishOrZero,
} from "@utilities/common/index.ts";
import {
	BaseInteraction,
	ChannelType,
	GuildMember,
	Message,
	type APIGuildMember,
	type APIInteractionDataResolvedGuildMember,
	type APIInteractionGuildMember,
	type APIMessage,
	type Attachment,
	type CategoryChannel,
	type Channel,
	type DMChannel,
	type NewsChannel,
	type PartialDMChannel,
	type PartialGroupDMChannel,
	type PrivateThreadChannel,
	type PublicThreadChannel,
	type StageChannel,
	type TextChannel,
	type ThreadChannel,
	type VoiceBasedChannel,
	type VoiceChannel,
} from "discord.js";

/**
 * Narrows a channel down to a category, the container other guild channels are nested under.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isCategoryChannel(
	channel: ChannelTypes | Nullish,
): channel is CategoryChannel {
	return channel?.type === ChannelType.GuildCategory;
}

/**
 * Narrows a channel down to a one-on-one DM. Partial DM channels pass too, since a partial carries
 * the same `type` as a fully cached one.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isDMChannel(
	channel: ChannelTypes | Nullish,
): channel is DMChannel | PartialDMChannel {
	return channel?.type === ChannelType.DM;
}

/**
 * Narrows a channel down to a group DM — a DM with more than two participants.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isGroupChannel(
	channel: Channel | PartialDMChannel | Nullish,
): channel is PartialGroupDMChannel {
	return channel?.type === ChannelType.GroupDM;
}

/**
 * Checks whether a channel belongs to a guild by ruling out DMs.
 *
 * @param channel The channel to inspect.
 * @returns Whether the channel is guild-based.
 *
 * @see {@link isGuildBasedChannelByGuildKey} for the variant that looks for a `guild` property
 * instead of comparing the channel type.
 *
 * @since 1.0.0
 */
export function isGuildBasedChannel(
	channel: ChannelTypes | Nullish,
): channel is GuildTextBasedChannelTypes {
	return channel?.type !== ChannelType.DM;
}

/**
 * Checks whether a channel belongs to a guild by looking for a `guild` property on it.
 *
 * @remarks Unlike {@link isGuildBasedChannel} this does not care about the channel's type, which
 * makes it the safer choice for objects that may not be fully populated.
 *
 * @param channel The channel to inspect.
 * @returns Whether the channel is guild-based.
 *
 * @since 1.0.0
 */
export function isGuildBasedChannelByGuildKey(
	channel: ChannelTypes | Nullish,
): channel is GuildTextBasedChannelTypes {
	return Reflect.has(channel ?? {}, "guild");
}

/**
 * Narrows a channel down to an announcement channel, whose messages other guilds may follow.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isNewsChannel(
	channel: ChannelTypes | Nullish,
): channel is NewsChannel {
	return channel?.type === ChannelType.GuildAnnouncement;
}

/**
 * Narrows a channel down to an ordinary guild text channel.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isTextChannel(
	channel: ChannelTypes | Nullish,
): channel is TextChannel {
	return channel?.type === ChannelType.GuildText;
}

/**
 * Narrows a channel down to a guild voice channel.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isVoiceChannel(
	channel: ChannelTypes | Nullish,
): channel is VoiceChannel {
	return channel?.type === ChannelType.GuildVoice;
}

/**
 * Narrows a channel down to a stage channel.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isStageChannel(
	channel: ChannelTypes | Nullish,
): channel is StageChannel {
	return channel?.type === ChannelType.GuildStageVoice;
}

/**
 * Narrows a channel down to a thread of any kind, delegating to discord.js' own `isThread` check.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isThreadChannel(
	channel: ChannelTypes | Nullish,
): channel is ThreadChannel {
	return channel?.isThread() ?? false;
}

/**
 * Narrows a channel down to a thread started from an announcement channel.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isNewsThreadChannel(
	channel: ChannelTypes | Nullish,
): channel is PublicThreadChannel {
	return channel?.type === ChannelType.AnnouncementThread;
}

/**
 * Narrows a channel down to a public thread.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isPublicThreadChannel(
	channel: ChannelTypes | Nullish,
): channel is PublicThreadChannel {
	return channel?.type === ChannelType.PublicThread;
}

/**
 * Narrows a channel down to a private thread.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isPrivateThreadChannel(
	channel: ChannelTypes | Nullish,
): channel is PrivateThreadChannel {
	return channel?.type === ChannelType.PrivateThread;
}

/**
 * Checks whether messages can be sent to a channel — in practice, whether it exposes a `send`
 * method.
 *
 * Partials are rejected because their `send` may not have been populated yet, and stage and group
 * DM channels are rejected outright.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isTextBasedChannel(
	channel: ChannelTypes | Nullish,
): channel is Exclude<
	TextBasedChannelTypes,
	StageChannel | PartialGroupDMChannel
> {
	if (
		isNullish(channel) || //
		channel.partial ||
		isGroupChannel(channel as Channel | PartialDMChannel | Nullish) ||
		isStageChannel(channel)
	) {
		return false;
	}

	return !isNullish(
		(
			channel as Exclude<
				TextBasedChannelTypes,
				StageChannel | PartialGroupDMChannel
			>
		).send,
	);
}

/**
 * Narrows a channel down to one users can connect to, delegating to discord.js' own
 * `isVoiceBased` check.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isVoiceBasedChannel(
	channel: Channel | Nullish,
): channel is VoiceBasedChannel {
	if (isNullish(channel)) return false;

	return channel.isVoiceBased();
}

/**
 * Checks whether a channel is allowed to carry age-restricted content.
 *
 * Channels that can never be marked NSFW — DMs, group DMs, categories, stages, voice channels and
 * directories — always come back `false`. Announcement, text, forum and media channels are checked
 * directly, while threads inherit the answer from the channel they were started in.
 *
 * @param channel The channel to inspect.
 *
 * @since 1.0.0
 */
export function isNsfwChannel(channel: ChannelTypes | Nullish): boolean {
	if (isNullish(channel)) return false;

	switch (channel.type) {
		case ChannelType.DM:
		case ChannelType.GroupDM:
		case ChannelType.GuildCategory:
		case ChannelType.GuildStageVoice:
		case ChannelType.GuildVoice:
		case ChannelType.GuildDirectory:
			return false;
		case ChannelType.GuildAnnouncement:
		case ChannelType.GuildText:
		case ChannelType.GuildForum:
		case ChannelType.GuildMedia:
			return (
				channel as Exclude<
					NonThreadGuildTextBasedChannelTypes,
					VoiceChannel | StageChannel
				>
			).nsfw;
		case ChannelType.AnnouncementThread:
		case ChannelType.PrivateThread:
		case ChannelType.PublicThread:
			return Boolean((channel as ThreadChannel).parent?.nsfw);
	}
}

/**
 * Distinguishes a fully constructed discord.js {@link Message} from the raw API payload of the same
 * name.
 *
 * @param message The message to inspect.
 * @returns `true` when the value is a discord.js `Message`.
 *
 * @since 1.0.0
 */
export function isMessageInstance(
	message: APIMessage | Message,
): message is Message {
	return message instanceof Message;
}

/**
 * Checks whether the given value is an interaction rather than a message. Every interaction class
 * discord.js exposes — commands, buttons, every select menu variant, autocomplete and modal
 * submissions — derives from `BaseInteraction` and therefore passes.
 *
 * @param messageOrInteraction The value to inspect.
 * @returns `true` when the value is an interaction.
 *
 * @see {@link isAnyInteractableInteraction} for the stricter check that also demands the
 * interaction can be replied to.
 *
 * @since 1.0.0
 */
export function isAnyInteraction(
	messageOrInteraction: APIMessage | Message | BaseInteraction,
): messageOrInteraction is BaseInteraction {
	return messageOrInteraction instanceof BaseInteraction;
}

/**
 * Checks whether the given value is an interaction a user can actually be replied to through.
 *
 * This is {@link isAnyInteraction} minus autocomplete: an autocomplete interaction only accepts a
 * list of suggestions, so replying to one is impossible.
 *
 * @param messageOrInteraction The value to inspect.
 * @returns `true` when the value is an interaction and is not an autocomplete interaction.
 *
 * @since 1.0.0
 */
export function isAnyInteractableInteraction(
	messageOrInteraction: APIMessage | Message | BaseInteraction,
): messageOrInteraction is AnyInteractableInteraction {
	if (isAnyInteraction(messageOrInteraction)) {
		return !messageOrInteraction.isAutocomplete();
	}

	return false;
}

/**
 * Distinguishes a fully constructed discord.js {@link GuildMember} from the several raw API member
 * shapes, and from nothing at all.
 *
 * @param member The member to inspect.
 * @returns `true` when the value is a discord.js `GuildMember`.
 *
 * @since 1.0.0
 */
export function isGuildMember(
	member:
		| GuildMember
		| APIGuildMember
		| APIInteractionGuildMember
		| APIInteractionDataResolvedGuildMember
		| Nullish,
): member is GuildMember {
	return member instanceof GuildMember;
}

/**
 * Checks whether an attachment carries playable or viewable media, based on its reported content
 * type.
 *
 * Audio is accepted on the content type alone. Images and videos must additionally report
 * dimensions, which weeds out attachments Discord could not actually decode.
 *
 * @param attachment The attachment to inspect.
 * @returns Whether the attachment is media.
 *
 * @since 1.0.0
 */
export function isMediaAttachment(attachment: Attachment): boolean {
	if (isNullishOrEmpty(attachment.contentType)) return false;

	if (attachment.contentType.startsWith("audio/")) return true;

	return attachment.contentType.startsWith("image/") ||
		attachment.contentType.startsWith("video/") //
		? hasDimensionsDefined(attachment)
		: false;
}

/**
 * Checks whether an attachment is an image: its content type must say so, and Discord must have
 * been able to measure it.
 *
 * @param attachment The attachment to inspect.
 * @returns Whether the attachment is an image.
 *
 * @since 1.0.0
 */
export function isImageAttachment(attachment: Attachment): boolean {
	return (
		!isNullishOrEmpty(attachment.contentType) && //
		attachment.contentType.startsWith("image/") &&
		hasDimensionsDefined(attachment)
	);
}

/**
 * Whether Discord managed to measure the attachment, which it only does for media it could decode.
 *
 * @internal Backs {@link isImageAttachment} and {@link isMediaAttachment}.
 */
function hasDimensionsDefined(attachment: Attachment): boolean {
	return (
		!isNullishOrZero(attachment.width) && !isNullishOrZero(attachment.height)
	);
}
