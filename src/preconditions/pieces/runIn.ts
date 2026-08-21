import type {
	AsyncPreconditionResult,
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PreconditionResult,
	RunInPreconditionContext,
} from "@types";
import type {
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { Command } from "@/structures/command.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";

/**
 * Confines a command to a set of channel types.
 *
 * Attached automatically by a command's `runIn` option, and the single check behind everything from
 * "guilds only" to "announcement threads only". The channel types may be given once for the whole
 * command, or separately per entry point.
 *
 * @since 1.0.0
 */
export class CoreRunInPrecondition extends AllFlowsPrecondition {
	public override messageRun(
		message: Message,
		_command: MessageCommand,
		context: RunInPreconditionContext,
	): PreconditionResult {
		if (!context.types) return this.ok();

		const channelType = message.channel.type;
		const allowed = Command.runInTypeIsSpecificsObject(context.types)
			? context.types.messageRun
			: context.types;

		return allowed.includes(channelType)
			? this.ok()
			: this.deny(context, "message");
	}

	public override async chatInputRun(
		interaction: ChatInputCommandInteraction,
		_command: ChatInputCommand,
		context: RunInPreconditionContext,
	): AsyncPreconditionResult {
		if (!context.types) return this.ok();

		const channelType = (await this.fetchChannelFromInteraction(interaction))
			.type;
		const allowed = Command.runInTypeIsSpecificsObject(context.types)
			? context.types.chatInputRun
			: context.types;

		return allowed.includes(channelType)
			? this.ok()
			: this.deny(context, "chat input");
	}

	public override async contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		_command: ContextMenuCommand,
		context: RunInPreconditionContext,
	): AsyncPreconditionResult {
		if (!context.types) return this.ok();

		const channelType = (await this.fetchChannelFromInteraction(interaction))
			.type;
		const allowed = Command.runInTypeIsSpecificsObject(context.types)
			? context.types.contextMenuRun
			: context.types;

		return allowed.includes(channelType)
			? this.ok()
			: this.deny(context, "context menu");
	}

	/**
	 * Refuses the command, carrying the permitted channel types along so a handler can spell out
	 * where the command *would* have worked.
	 */
	private deny(
		context: RunInPreconditionContext,
		commandType: string,
	): PreconditionResult {
		return this.error({
			identifier: Identifiers.PreconditionRunIn,
			message: `You cannot run this ${commandType} command in this type of channel.`,
			context: { types: context.types },
		});
	}
}

void container.stores.loadPiece({
	name: "RunIn",
	piece: CoreRunInPrecondition,
	store: "preconditions",
});
