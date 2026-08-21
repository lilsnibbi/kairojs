import type {
	Awaitable,
	GuildBasedChannelTypes,
	MessageResolverOptions,
} from "@types";
import {
	PermissionFlagsBits,
	type Message,
	type Snowflake,
	type User,
} from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import {
	ChannelMessageRegex,
	MessageLinkRegex,
	SnowflakeRegex,
} from "@utilities/discord/index.ts";
import {
	isAnyInteraction,
	isGuildBasedChannel,
	isNewsChannel,
	isStageChannel,
	isTextBasedChannel,
	isTextChannel,
} from "@utilities/discordjs/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves a message from the three shapes people paste into chat: a bare id, a full message link,
 * or the `channelId-messageId` pair the client's "Copy ID" produces on a shift-click.
 *
 * The forms are tried in that order and the first hit wins. Whichever one matches, the message is
 * only returned if the person who invoked the command could have read it themselves, so a command
 * cannot be used to peek into a channel they lack access to.
 *
 * @param parameter The raw text to interpret.
 * @param options The channel, base message or interaction, and scan behaviour to resolve against.
 * @returns The message, or `messageError` when none of the forms resolve.
 *
 * @since 1.0.0
 */
export async function resolveMessage(
	parameter: string,
	options: MessageResolverOptions,
): Promise<Result<Message, typeof Identifiers.ArgumentMessageError>> {
	const message =
		(await findById(parameter, options)) ??
		(await findByLink(parameter, options)) ??
		(await findByChannelAndMessage(parameter, options));

	if (message) {
		return ok(message);
	}

	return err(Identifiers.ArgumentMessageError);
}

/**
 * Resolves a bare snowflake.
 *
 * An explicit channel is asked directly. Otherwise, when scanning is enabled and the command ran
 * in a guild, every cached text channel of that guild is swept before falling back to the channel
 * the command itself came from. Stage channels are skipped throughout — they hold no messages.
 */
function findById(
	parameter: string,
	options: MessageResolverOptions,
): Awaitable<Message | null> {
	if (
		!SnowflakeRegex.test(parameter) ||
		isStageChannel(options.messageOrInteraction.channel)
	) {
		return null;
	}

	if (options.channel && !isStageChannel(options.channel)) {
		return options.channel.messages.fetch(parameter as Snowflake);
	}

	if (
		options.scan &&
		isGuildBasedChannel(options.messageOrInteraction.channel)
	) {
		for (const channel of options.messageOrInteraction.channel.guild.channels.cache.values()) {
			if (!isTextBasedChannel(channel) || isStageChannel(channel)) {
				continue;
			}

			const message = channel.messages.cache.get(parameter);
			if (message) {
				return message;
			}
		}
	}

	return (
		options.messageOrInteraction.channel?.messages.fetch(
			parameter as Snowflake,
		) ?? null
	);
}

/**
 * Resolves a full message link, refusing links that point outside the guild the command ran in.
 */
async function findByLink(
	parameter: string,
	options: MessageResolverOptions,
): Promise<Message | null> {
	if (!options.messageOrInteraction.guild) {
		return null;
	}

	const matches = MessageLinkRegex.exec(parameter);
	if (!matches) {
		return null;
	}

	const [, guildId, channelId, messageId] = matches;

	const guild = container.client.guilds.cache.get(guildId as Snowflake);
	if (guild !== options.messageOrInteraction.guild) {
		return null;
	}

	return fetchVisibleMessage(channelId!, messageId!, resolveRequester(options));
}

/**
 * Resolves the `channelId-messageId` pair produced by shift-clicking "Copy ID".
 */
async function findByChannelAndMessage(
	parameter: string,
	options: MessageResolverOptions,
): Promise<Message | null> {
	const groups = ChannelMessageRegex.exec(parameter)?.groups;

	if (!groups) {
		return null;
	}

	return fetchVisibleMessage(
		groups.channelId!,
		groups.messageId!,
		resolveRequester(options),
	);
}

/**
 * Picks out the user behind the message or interaction the lookup is anchored to.
 */
function resolveRequester(options: MessageResolverOptions): User {
	return isAnyInteraction(options.messageOrInteraction)
		? options.messageOrInteraction.user
		: options.messageOrInteraction.author;
}

/**
 * Fetches a message from a cached channel, but only once the channel is one the bot can read and
 * the requester is allowed to view. Any doubt resolves to `null`.
 */
async function fetchVisibleMessage(
	channelId: Snowflake,
	messageId: Snowflake,
	requester: User,
): Promise<Message | null> {
	const channel = container.client.channels.cache.get(
		channelId,
	) as GuildBasedChannelTypes;
	if (!channel) {
		return null;
	}

	if (!(isNewsChannel(channel) || isTextChannel(channel))) {
		return null;
	}

	if (!channel.viewable) {
		return null;
	}

	if (
		!channel.permissionsFor(requester)?.has(PermissionFlagsBits.ViewChannel)
	) {
		return null;
	}

	return channel.messages.fetch(messageId);
}
