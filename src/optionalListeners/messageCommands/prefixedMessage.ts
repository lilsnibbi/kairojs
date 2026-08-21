import type { MessageCommand, PieceLoaderContext } from "@types";
import type { Message } from "discord.js";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Splits a prefixed message into a command name and its parameters, and resolves the name to a
 * command.
 *
 * Every way this can come to nothing — no name after the prefix, no such command, a command with no
 * message handler — is announced as its own event rather than ignored, which is what makes a
 * "did you mean…?" reply or an unknown-command counter possible.
 *
 * @since 1.0.0
 */
export class CorePrefixedMessageListener extends Listener<
	"client",
	typeof Events.PrefixedMessage
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PrefixedMessage });
	}

	public run(message: Message, prefix: string | RegExp) {
		const { client, stores } = this.container;

		const commandPrefix = this.getCommandPrefix(message.content, prefix);
		const prefixLess = message.content.slice(commandPrefix.length).trim();

		// Where the name stops and the parameters begin. `-1` means the whole thing is the name.
		const spaceIndex = prefixLess.indexOf(" ");
		const commandName =
			spaceIndex === -1 ? prefixLess : prefixLess.slice(0, spaceIndex);

		if (commandName.length === 0) {
			client.emit(Events.UnknownMessageCommandName, {
				message,
				prefix,
				commandPrefix,
			});
			return;
		}

		const command = stores
			.get("commands")
			.get(
				client.options.caseInsensitiveCommands
					? commandName.toLowerCase()
					: commandName,
			);
		if (!command) {
			client.emit(Events.UnknownMessageCommand, {
				message,
				prefix,
				commandName,
				commandPrefix,
			});
			return;
		}

		// The command may still exist purely as a slash or context-menu command.
		if (!command.messageRun) {
			client.emit(Events.CommandDoesNotHaveMessageCommandHandler, {
				message,
				prefix,
				commandPrefix,
				command,
			});
			return;
		}

		const parameters =
			spaceIndex === -1 ? "" : prefixLess.substring(spaceIndex + 1).trim();

		client.emit(Events.PreMessageCommandRun, {
			message,
			command: command as MessageCommand,
			parameters,
			context: { commandName, commandPrefix, prefix },
		});
	}

	/**
	 * The exact text the prefix took up in this message, which for a regular expression prefix is
	 * only knowable by running it again.
	 */
	private getCommandPrefix(content: string, prefix: string | RegExp): string {
		return typeof prefix === "string" ? prefix : prefix.exec(content)![0];
	}
}
