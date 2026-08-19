import type { PatternCommandAcceptedPayload, PieceLoaderContext } from "@types";
import { Result } from "@utilities/result/index.ts";
import { Stopwatch } from "@utilities/stopwatch/index.ts";
import { PatternCommandEvents } from "@/constants/pattern-commands.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs the pattern command that won the selection, and reports how it went.
 *
 * The handler is wrapped so a throw becomes an error event rather than an unhandled rejection, and
 * the finished event is emitted either way — a failed run still took time, and something watching
 * for completion should not be left waiting.
 *
 * @since 1.0.0
 */
export class PluginPatternCommandsCommandAcceptedListener extends Listener<
	"client",
	typeof PatternCommandEvents.CommandAccepted
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: PatternCommandEvents.CommandAccepted,
		});
	}

	public async run(payload: PatternCommandAcceptedPayload) {
		const { message, command } = payload;

		const outcome = await Result.fromAsync(async () => {
			message.client.emit(
				PatternCommandEvents.CommandRun,
				message,
				command,
				payload,
			);

			const stopwatch = new Stopwatch();
			const result = await command.messageRun(message);
			const { duration } = stopwatch.stop();

			message.client.emit(PatternCommandEvents.CommandSuccess, {
				...payload,
				result,
				duration,
			});

			return duration;
		});

		// A failed run has no measured duration, so -1 stands in for "never finished".
		outcome.inspectErr((error) =>
			message.client.emit(PatternCommandEvents.CommandError, error, {
				...payload,
				duration: -1,
			}),
		);

		message.client.emit(
			PatternCommandEvents.CommandFinished,
			message,
			command,
			{
				...payload,
				success: outcome.isOk(),
				duration: outcome.unwrapOr(-1),
			},
		);
	}
}

void container.stores.loadPiece({
	name: "PluginCommandAccepted",
	piece: PluginPatternCommandsCommandAcceptedListener,
	store: "listeners",
});
