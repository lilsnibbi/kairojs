import {
	PermissionFlagsBits,
	PermissionsBitField,
	type Message,
} from "discord.js";
import type {
	GuildBasedChannelTypes,
	PieceLoaderContext,
	PossiblePatternCommand,
} from "@types";
import { isDMChannel } from "@utilities/discordjs/index.ts";
import { PatternCommandEvents } from "@/constants/patternCommands.ts";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Scans every message the framework parses for pattern commands that claim it.
 *
 * Matching is deliberately generous — an exact hit on the name, an exact hit on an alias, then the
 * name and each alias treated as a regular expression — because a pattern command is meant to react
 * to phrasing rather than to a precise invocation. Everything that matches is collected and handed
 * on in descending weight order; picking one of them is the next listener's job.
 *
 * @since 1.0.0
 */
export class PluginPatternCommandsMessageParseListener extends Listener<
	"client",
	typeof Events.PreMessageParsed
> {
	/**
	 * The permissions the bot needs before it can usefully react to a message at all.
	 */
	private readonly requiredPermissions = new PermissionsBitField([
		PermissionFlagsBits.ViewChannel,
		PermissionFlagsBits.SendMessages,
	]).freeze();

	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PreMessageParsed });
	}

	public async run(message: Message) {
		const canRun = await this.canRunInChannel(message);
		if (!canRun) return;

		let { content } = message;
		const { client, stores } = this.container;
		const patternCommandStore = stores.get("pattern-commands");

		if (client.options.caseInsensitiveCommands) content = content.toLowerCase();

		const possiblePatternCommands: PossiblePatternCommand[] = [];
		const regexFlags = client.options.caseInsensitiveCommands ? "i" : undefined;

		for (const [key, patternCommand] of patternCommandStore) {
			const { weight } = patternCommand;

			if (content === key) {
				possiblePatternCommands.push({
					command: patternCommand,
					alias: key,
					weight,
				});
				continue;
			}

			const aliasMatch = patternCommand.aliases.find(
				(alias) => alias === content,
			);
			if (aliasMatch) {
				possiblePatternCommands.push({
					command: patternCommand,
					alias: aliasMatch,
					weight,
				});
				continue;
			}

			if (
				content.match(
					new RegExp(
						patternCommand.matchFullName ? `\\b${key}\\b` : key,
						regexFlags,
					),
				)
			) {
				possiblePatternCommands.push({
					command: patternCommand,
					alias: content,
					weight,
				});
				continue;
			}

			const aliasRegexMatch = patternCommand.aliases.find((alias) =>
				content.match(new RegExp(alias, regexFlags)),
			);
			if (aliasRegexMatch) {
				possiblePatternCommands.push({
					command: patternCommand,
					alias: aliasRegexMatch,
					weight,
				});
			}
		}

		if (possiblePatternCommands.length > 0) {
			const sortedPossiblePatternCommands = possiblePatternCommands.sort(
				(first, second) => second.weight - first.weight,
			);

			client.emit(PatternCommandEvents.PreCommandRun, {
				message,
				possibleCommands: sortedPossiblePatternCommands,
			});
		}
	}

	/**
	 * Whether the bot may speak where the message was sent.
	 *
	 * A DM always qualifies. Anywhere else the bot's own member has to be resolvable and hold the
	 * permissions needed to see the channel and reply in it.
	 *
	 * @param message The message to check.
	 */
	private async canRunInChannel(message: Message): Promise<boolean> {
		if (isDMChannel(message.channel)) return true;

		const me = await message.guild?.members.fetchMe();
		if (!me) return false;

		const channel = message.channel as GuildBasedChannelTypes;
		return channel.permissionsFor(me).has(this.requiredPermissions, false);
	}
}

void container.stores.loadPiece({
	name: "PluginMessageParse",
	piece: PluginPatternCommandsMessageParseListener,
	store: "listeners",
});
