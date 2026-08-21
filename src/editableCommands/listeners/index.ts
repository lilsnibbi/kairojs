import { container } from "@/container.ts";
import { EditableCommandsMessageUpdateListener } from "./messageUpdate.ts";

/**
 * Registers the listener that makes message commands re-run when their invocation is edited.
 *
 * The listener is handed to the store directly rather than discovered on disk, so it lives inside
 * the framework and never has to be copied into a bot's `listeners` folder.
 *
 * @since 1.0.0
 */
export function loadEditableCommandsListeners() {
	void container.stores.loadPiece({
		name: "CoreEditableCommandsMessageUpdate",
		piece: EditableCommandsMessageUpdateListener,
		store: "listeners",
	});
}
