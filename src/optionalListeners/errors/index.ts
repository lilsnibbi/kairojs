import { container } from "@/container.ts";
import { CoreChatInputCommandErrorListener } from "./chatInputCommandError.ts";
import { CoreCommandApplicationCommandRegistryErrorListener } from "./commandApplicationCommandRegistryError.ts";
import { CoreCommandAutocompleteInteractionErrorListener } from "./commandAutocompleteInteractionError.ts";
import { CoreContextMenuCommandErrorListener } from "./contextMenuCommandError.ts";
import { CoreInteractionHandlerErrorListener } from "./interactionHandlerError.ts";
import { CoreInteractionHandlerParseErrorListener } from "./interactionHandlerParseError.ts";
import { CoreListenerErrorListener } from "./listenerError.ts";
import { CoreMessageCommandErrorListener } from "./messageCommandError.ts";

/**
 * Registers the listeners that write Kairo's error events to the logger.
 *
 * Unlike the other built-in sets, these are registered on request rather than on import, because a
 * bot that reports its errors somewhere else — a channel, an error tracker — wants to replace them
 * rather than log everything twice. Switch them off with `loadDefaultErrorListeners: false`.
 *
 * Nothing else in the framework depends on these being loaded: with them gone, the error events
 * still fire and simply go unheard.
 *
 * @since 1.0.0
 */
export function loadErrorListeners() {
	const store = "listeners" as const;

	void container.stores.loadPiece({
		name: "CoreChatInputCommandError",
		piece: CoreChatInputCommandErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreCommandApplicationCommandRegistryError",
		piece: CoreCommandApplicationCommandRegistryErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreCommandAutocompleteInteractionError",
		piece: CoreCommandAutocompleteInteractionErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreContextMenuCommandError",
		piece: CoreContextMenuCommandErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreInteractionHandlerError",
		piece: CoreInteractionHandlerErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreInteractionHandlerParseError",
		piece: CoreInteractionHandlerParseErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreListenerError",
		piece: CoreListenerErrorListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreMessageCommandError",
		piece: CoreMessageCommandErrorListener,
		store,
	});
}
