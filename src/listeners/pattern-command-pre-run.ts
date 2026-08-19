import type {
	MessageCommand,
	PatternCommandPayload,
	PatternCommandPrePayload,
	PieceLoaderContext,
	PreconditionContext,
} from "@types";
import { cast } from "@utilities/utilities/index.ts";
import { PatternCommandEvents } from "@/constants/pattern-commands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Picks which of the commands that matched a message actually gets to run.
 *
 * Candidates arrive already sorted by weight and are tried in that order: each is put through the
 * global preconditions, then its own, then its chance roll. The first one to survive all three wins
 * and the rest are abandoned — a message triggers at most one pattern command.
 *
 * @since 1.0.0
 */
export class PluginPatternCommandsPreCommandRunListener extends Listener<
	"client",
	typeof PatternCommandEvents.PreCommandRun
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: PatternCommandEvents.PreCommandRun,
		});
	}

	public async run(payload: PatternCommandPrePayload) {
		const { message, possibleCommands } = payload;

		for (const possibleCommand of possibleCommands) {
			const { command } = possibleCommand;
			const commandPayload: PatternCommandPayload = {
				message,
				command,
				alias: possibleCommand.alias,
			};

			const globalResult = await this.container.stores
				.get("preconditions")
				.messageRun(
					message,
					cast<MessageCommand>(command),
					cast<PreconditionContext>(commandPayload),
				);

			if (globalResult.isErr()) {
				message.client.emit(
					PatternCommandEvents.CommandDenied,
					globalResult.unwrapErr(),
					commandPayload,
				);
				continue;
			}

			const localResult = await command.preconditions.messageRun(
				message,
				cast<MessageCommand>(command),
				cast<PreconditionContext>(payload),
			);

			if (localResult.isErr()) {
				message.client.emit(
					PatternCommandEvents.CommandDenied,
					localResult.unwrapErr(),
					commandPayload,
				);
				continue;
			}

			// A chance of 100 always clears a roll of 1 to 100, so a command that never opted out of
			// the default is never skipped here.
			if (command.chance >= Math.round(Math.random() * 99) + 1) {
				message.client.emit(
					PatternCommandEvents.CommandAccepted,
					commandPayload,
				);
				break;
			}

			message.client.emit(PatternCommandEvents.CommandNoLuck, commandPayload);
		}
	}
}

void container.stores.loadPiece({
	name: "PluginPreCommandRun",
	piece: PluginPatternCommandsPreCommandRunListener,
	store: "listeners",
});
