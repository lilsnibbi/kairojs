import { container } from "@/container.ts";
import { CoreChatInputCommandErrorListener } from "./chat-input-command-error.ts";
import { CoreCommandApplicationCommandRegistryErrorListener } from "./command-application-command-registry-error.ts";
import { CoreCommandAutocompleteInteractionErrorListener } from "./command-autocomplete-interaction-error.ts";
import { CoreContextMenuCommandErrorListener } from "./context-menu-command-error.ts";
import { CoreInteractionHandlerErrorListener } from "./interaction-handler-error.ts";
import { CoreInteractionHandlerParseErrorListener } from "./interaction-handler-parse-error.ts";
import { CoreListenerErrorListener } from "./listener-error.ts";
import { CoreMessageCommandErrorListener } from "./message-command-error.ts";

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
