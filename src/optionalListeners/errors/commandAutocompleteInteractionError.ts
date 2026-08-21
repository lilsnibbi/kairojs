import type {
	AutocompleteInteractionPayload,
	PieceLoaderContext,
} from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes to the logger when a command's `autocompleteRun` throws.
 *
 * @since 1.0.0
 */
export class CoreCommandAutocompleteInteractionErrorListener extends Listener<
	"client",
	typeof Events.CommandAutocompleteInteractionError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.CommandAutocompleteInteractionError,
		});
	}

	public run(error: unknown, payload: AutocompleteInteractionPayload) {
		const { name, location } = payload.command;
		this.container.logger.error(
			`Encountered error while handling an autocomplete run method on command "${name}" at path "${location.full}"`,
			error,
		);
	}
}
