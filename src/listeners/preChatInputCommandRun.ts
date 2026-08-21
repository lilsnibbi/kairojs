import type {
	PieceLoaderContext,
	PreChatInputCommandRunPayload,
	PreconditionContext,
} from "@types";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs the preconditions guarding a slash command, and accepts it only if they all pass.
 *
 * Global preconditions come first and short-circuit on the first refusal, so a command's own checks
 * never see an invocation the framework has already turned away.
 *
 * @since 1.0.0
 */
export class CorePreChatInputCommandRunListener extends Listener<
	"client",
	typeof Events.PreChatInputCommandRun
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PreChatInputCommandRun });
	}

	public async run(payload: PreChatInputCommandRunPayload) {
		const { command, interaction } = payload;
		const { client, stores } = this.container;

		// The payload doubles as the precondition context, so a check can read the whole invocation.
		const context = payload as unknown as PreconditionContext;

		const globalResult = await stores
			.get("preconditions")
			.chatInputRun(interaction, command, context);
		if (globalResult.isErr()) {
			client.emit(
				Events.ChatInputCommandDenied,
				globalResult.unwrapErr(),
				payload,
			);
			return;
		}

		const localResult = await command.preconditions.chatInputRun(
			interaction,
			command,
			context,
		);
		if (localResult.isErr()) {
			client.emit(
				Events.ChatInputCommandDenied,
				localResult.unwrapErr(),
				payload,
			);
			return;
		}

		client.emit(Events.ChatInputCommandAccepted, payload);
	}
}

void container.stores.loadPiece({
	name: "CorePreChatInputCommandRun",
	piece: CorePreChatInputCommandRunListener,
	store: "listeners",
});
