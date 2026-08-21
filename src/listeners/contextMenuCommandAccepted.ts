import type {
	ContextMenuCommandAcceptedPayload,
	PieceLoaderContext,
} from "@types";
import { Result } from "@utilities/result/index.ts";
import { Stopwatch } from "@utilities/stopwatch/index.ts";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs a context-menu command that has cleared its preconditions, timing it and reporting the
 * outcome.
 *
 * The run is wrapped in a {@link Result} so a thrown error becomes a `contextMenuCommandError` event
 * rather than an unhandled rejection, and the finish event fires either way — a bot that logs
 * command usage therefore sees every invocation, successful or not. A failed run reports a duration
 * of `-1`, since no meaningful measurement exists for work that did not complete.
 *
 * @since 1.0.0
 */
export class CoreContextMenuCommandAcceptedListener extends Listener<
	"client",
	typeof Events.ContextMenuCommandAccepted
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.ContextMenuCommandAccepted,
		});
	}

	public async run(payload: ContextMenuCommandAcceptedPayload) {
		const { command, context, interaction } = payload;
		const { client } = this.container;

		const outcome = await Result.fromAsync(async () => {
			client.emit(Events.ContextMenuCommandRun, interaction, command, {
				...payload,
			});

			const stopwatch = new Stopwatch();
			const result = await command.contextMenuRun(interaction, context);
			const { duration } = stopwatch.stop();

			client.emit(Events.ContextMenuCommandSuccess, {
				...payload,
				result,
				duration,
			});

			return duration;
		});

		outcome.inspectErr((error) =>
			client.emit(Events.ContextMenuCommandError, error, {
				...payload,
				duration: -1,
			}),
		);

		client.emit(Events.ContextMenuCommandFinish, interaction, command, {
			...payload,
			success: outcome.isOk(),
			duration: outcome.unwrapOr(-1),
		});
	}
}

void container.stores.loadPiece({
	name: "CoreContextMenuCommandAccepted",
	piece: CoreContextMenuCommandAcceptedListener,
	store: "listeners",
});
