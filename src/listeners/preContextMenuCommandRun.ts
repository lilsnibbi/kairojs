import type {
	PieceLoaderContext,
	PreContextMenuCommandRunPayload,
	PreconditionContext,
} from "@types";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Runs the preconditions guarding a context-menu command, and accepts it only if they all pass.
 *
 * Global preconditions come first and short-circuit on the first refusal, so a command's own checks
 * never see an invocation the framework has already turned away.
 *
 * @since 1.0.0
 */
export class CorePreContextMenuCommandRunListener extends Listener<
	"client",
	typeof Events.PreContextMenuCommandRun
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.PreContextMenuCommandRun });
	}

	public async run(payload: PreContextMenuCommandRunPayload) {
		const { command, interaction } = payload;
		const { client, stores } = this.container;

		// The payload doubles as the precondition context, so a check can read the whole invocation.
		const context = payload as unknown as PreconditionContext;

		const globalResult = await stores
			.get("preconditions")
			.contextMenuRun(interaction, command, context);
		if (globalResult.isErr()) {
			client.emit(
				Events.ContextMenuCommandDenied,
				globalResult.unwrapErr(),
				payload,
			);
			return;
		}

		const localResult = await command.preconditions.contextMenuRun(
			interaction,
			command,
			context,
		);
		if (localResult.isErr()) {
			client.emit(
				Events.ContextMenuCommandDenied,
				localResult.unwrapErr(),
				payload,
			);
			return;
		}

		client.emit(Events.ContextMenuCommandAccepted, payload);
	}
}

void container.stores.loadPiece({
	name: "CorePreContextMenuCommandRun",
	piece: CorePreContextMenuCommandRunListener,
	store: "listeners",
});
