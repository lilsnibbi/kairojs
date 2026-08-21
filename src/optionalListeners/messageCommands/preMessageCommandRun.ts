import type {
	PieceLoaderContext,
	PreMessageCommandRunPayload,
	PreconditionContext,
} from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs the preconditions guarding a message command, and accepts it only if they all pass.
 *
 * Global preconditions come first and short-circuit on the first refusal, so a command's own checks
 * never see an invocation the framework has already turned away.
 *
 * @since 1.0.0
 */
export class CorePreMessageCommandRunListener extends Listener<
	"client",
	typeof Events.PreMessageCommandRun
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PreMessageCommandRun });
	}

	public async run(payload: PreMessageCommandRunPayload) {
		const { message, command } = payload;
		const { stores } = this.container;

		// The payload doubles as the precondition context, so a check can read the whole invocation.
		const context = payload as unknown as PreconditionContext;

		const globalResult = await stores
			.get("preconditions")
			.messageRun(message, command, context);
		if (globalResult.isErr()) {
			message.client.emit(
				Events.MessageCommandDenied,
				globalResult.unwrapErr(),
				payload,
			);
			return;
		}

		const localResult = await command.preconditions.messageRun(
			message,
			command,
			context,
		);
		if (localResult.isErr()) {
			message.client.emit(
				Events.MessageCommandDenied,
				localResult.unwrapErr(),
				payload,
			);
			return;
		}

		message.client.emit(Events.MessageCommandAccepted, payload);
	}
}
