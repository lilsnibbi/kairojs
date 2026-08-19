import type { PieceLoaderContext } from "@types";
import {
	ChannelType,
	PermissionFlagsBits,
	PermissionsBitField,
	type Message,
} from "discord.js";
import { isDMChannel } from "@utilities/discord.js-utilities/index.ts";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Decides whether a message carries a prefix, and which one.
 *
 * Three sources are consulted in order of specificity: a mention of the bot, the configured regular
 * expression, then the ordinary string prefixes. The first that matches wins, and a message that
 * matches none is announced as unprefixed so a bot can still react to it.
 *
 * @since 1.0.0
 */
export class CorePreMessageParserListener extends Listener<
	"client",
	typeof Events.PreMessageParsed
> {
	/**
	 * The bare minimum needed to answer at all. Without both, parsing the message would only lead to
	 * a reply the bot cannot send.
	 */
	private readonly requiredPermissions = new PermissionsBitField([
		PermissionFlagsBits.ViewChannel,
		PermissionFlagsBits.SendMessages,
	]).freeze();

	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PreMessageParsed });
	}

	public async run(message: Message) {
		if (!(await this.canRunInChannel(message))) return;

		const { client } = this.container;
		const { regexPrefix } = client.options;

		let prefix: string | RegExp | null = null;
		const mentionPrefix = this.getMentionPrefix(message);

		if (mentionPrefix) {
			// A message that is nothing but the mention has no command in it, but is worth reporting:
			// it is how a user asks a bot what its prefix is.
			if (message.content.length === mentionPrefix.length) {
				client.emit(Events.MentionPrefixOnly, message);
				return;
			}

			prefix = mentionPrefix;
		} else if (regexPrefix?.test(message.content)) {
			prefix = regexPrefix;
		} else {
			const prefixes = await client.fetchPrefix(message);
			prefix = this.getPrefix(message.content, prefixes);
		}

		if (prefix === null) client.emit(Events.NonPrefixedMessage, message);
		else client.emit(Events.PrefixedMessage, message, prefix);
	}

	/**
	 * Whether the bot could actually answer in the channel the message came from.
	 *
	 * Group DMs are refused outright — a bot cannot be in one — while an ordinary DM always passes,
	 * since permissions do not apply there.
	 */
	private async canRunInChannel(message: Message): Promise<boolean> {
		if (message.channel.type === ChannelType.GroupDM) return false;
		if (isDMChannel(message.channel)) return true;

		const me = await message.guild?.members.fetchMe();
		if (!me) return false;

		const permissions = message.channel.permissionsFor(me);
		if (!permissions) return false;

		return permissions.has(this.requiredPermissions, true);
	}

	/**
	 * Extracts a leading mention of the bot, if the message opens with one.
	 *
	 * The length and prefix checks come first because this runs for every message: a mention is at
	 * least twenty characters and always starts with `<@`, so anything shorter can be dismissed
	 * without touching the cache. A role mention is accepted too, because that is what a mention of
	 * a bot resolves to once it has a managed role.
	 */
	private getMentionPrefix(message: Message): string | null {
		if (this.container.client.disableMentionPrefix) return null;
		if (message.content.length < 20 || !message.content.startsWith("<@"))
			return null;

		const [offset, id] =
			message.content[2] === "&"
				? [3, message.guild?.roles.botRoleFor(this.container.client.id!)?.id]
				: [message.content[2] === "!" ? 3 : 2, this.container.client.id];

		if (!id) return null;

		const offsetWithId = offset + id.length;

		if (message.content[offsetWithId] !== ">") return null;

		return message.content.substring(offset, offsetWithId) === id
			? message.content.substring(0, offsetWithId + 1)
			: null;
	}

	/**
	 * Picks the first configured prefix the message starts with.
	 *
	 * Under case-insensitive matching the comparison is lower-cased on both sides, but the prefix
	 * returned is the one as configured, so anything downstream measuring its length still lines up
	 * with the original content.
	 */
	private getPrefix(
		content: string,
		prefixes: readonly string[] | string | null,
	): string | null {
		if (prefixes === null) return null;

		const { caseInsensitivePrefixes } = this.container.client.options;
		const haystack = caseInsensitivePrefixes ? content.toLowerCase() : content;

		if (typeof prefixes === "string") {
			return haystack.startsWith(
				caseInsensitivePrefixes ? prefixes.toLowerCase() : prefixes,
			)
				? prefixes
				: null;
		}

		return (
			prefixes.find((prefix) =>
				haystack.startsWith(
					caseInsensitivePrefixes ? prefix.toLowerCase() : prefix,
				),
			) ?? null
		);
	}
}
