import { Command } from "@/structures/command.ts";
import type {
	ApplicationCommandRegistry,
	ChatInputCommandRunContext,
	MessageCommandRunContext,
	PieceLoaderContext,
} from "@types";
import type { ChatInputCommandInteraction, Message } from "discord.js";

/**
 * Exercises both entry points on one class, plus application-command registration.
 */
export class PingCommand extends Command {
	public constructor(context: PieceLoaderContext<"commands">) {
		super(context, {
			name: "ping",
			aliases: ["pong"],
			description: "Replies with a pong.",
			preconditions: ["OwnerOnly"],
		});
	}

	public override registerApplicationCommands(
		registry: ApplicationCommandRegistry,
	) {
		registry.registerChatInputCommand((builder) =>
			builder.setName("ping").setDescription("Replies with a pong."),
		);
	}

	public override messageRun(
		message: Message,
		_args: unknown,
		_context: MessageCommandRunContext,
	) {
		return message.reply("Pong!");
	}

	public override chatInputRun(
		interaction: ChatInputCommandInteraction,
		_context: ChatInputCommandRunContext,
	) {
		return interaction.reply("Pong!");
	}
}
