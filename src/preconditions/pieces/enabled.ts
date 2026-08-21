import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PieceLoaderContext,
	PreconditionContext,
	PreconditionResult,
} from "@types";
import type {
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";

/**
 * Refuses a command that has been disabled.
 *
 * This is a global precondition, so it runs for every command whether or not the command asks for
 * it. Its position leaves room ahead of it for a bot to insert checks that must come first, such as
 * a maintenance-mode gate.
 *
 * @since 1.0.0
 */
export class CoreEnabledPrecondition extends AllFlowsPrecondition {
	public constructor(context: PieceLoaderContext<"preconditions">) {
		super(context, { position: 10 });
	}

	public messageRun(
		_message: Message,
		command: MessageCommand,
		context: PreconditionContext,
	): PreconditionResult {
		return command.enabled
			? this.ok()
			: this.error({
					identifier: Identifiers.CommandDisabled,
					message: "This message command is disabled.",
					context,
				});
	}

	public chatInputRun(
		_interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext,
	): PreconditionResult {
		return command.enabled
			? this.ok()
			: this.error({
					identifier: Identifiers.CommandDisabled,
					message: "This chat input command is disabled.",
					context,
				});
	}

	public contextMenuRun(
		_interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext,
	): PreconditionResult {
		return command.enabled
			? this.ok()
			: this.error({
					identifier: Identifiers.CommandDisabled,
					message: "This context menu command is disabled.",
					context,
				});
	}
}

void container.stores.loadPiece({
	name: "Enabled",
	piece: CoreEnabledPrecondition,
	store: "preconditions",
});
