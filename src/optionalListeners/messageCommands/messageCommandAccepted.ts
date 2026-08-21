import type { MessageCommandAcceptedPayload, PieceLoaderContext } from "@types";
import { Result } from "@utilities/result/index.ts";
import { Stopwatch } from "@utilities/stopwatch/index.ts";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs a message command that has cleared its preconditions, timing it and reporting the outcome.
 *
 * Parsing the parameters happens before the timer starts, so the measured duration is the command's
 * own work rather than the argument parsing that preceded it. The run itself is wrapped in a
 * {@link Result} so a thrown error becomes a `messageCommandError` event rather than an unhandled
 * rejection, and the finish event fires either way. A failed run reports a duration of `-1`, since
 * no meaningful measurement exists for work that did not complete.
 *
 * @since 1.0.0
 */
export class CoreMessageCommandAcceptedListener extends Listener<
	"client",
	typeof Events.MessageCommandAccepted
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.MessageCommandAccepted });
	}

	public async run(payload: MessageCommandAcceptedPayload) {
		const { message, command, parameters, context } = payload;
		const args = await command.messagePreParse(message, parameters, context);

		const outcome = await Result.fromAsync(async () => {
			message.client.emit(Events.MessageCommandRun, message, command, {
				...payload,
				args,
			});

			const stopwatch = new Stopwatch();
			const result = await command.messageRun(message, args, context);
			const { duration } = stopwatch.stop();

			message.client.emit(Events.MessageCommandSuccess, {
				...payload,
				args,
				result,
				duration,
			});

			return duration;
		});

		outcome.inspectErr((error) =>
			message.client.emit(Events.MessageCommandError, error, {
				...payload,
				args,
				duration: -1,
			}),
		);

		message.client.emit(Events.MessageCommandFinish, message, command, {
			...payload,
			args,
			success: outcome.isOk(),
			duration: outcome.unwrapOr(-1),
		});
	}
}
