import { container } from "@/container.ts";
import { CoreMessageCommandAcceptedListener } from "./message-command-accepted.ts";
import { CoreMessageCommandTypingListener } from "./message-command-typing.ts";
import { CoreMessageCreateListener } from "./message-create.ts";
import { CorePreMessageCommandRunListener } from "./pre-message-command-run.ts";
import { CorePreMessageParserListener } from "./pre-message-parser.ts";
import { CorePrefixedMessageListener } from "./prefixed-message.ts";

/**
 * Registers the listeners that make prefixed message commands work.
 *
 * Together they form the whole pipeline: every message is filtered, checked for a prefix, split into
 * a command name and parameters, run through its preconditions, and finally invoked.
 *
 * They are registered on request rather than on import because message commands need the message
 * content intent, which many bots neither have nor want. Switch them off with
 * `loadMessageCommandListeners: false` and nothing in the chain ever fires.
 *
 * @since 1.0.0
 */
export function loadMessageCommandListeners() {
	const store = "listeners" as const;

	void container.stores.loadPiece({
		name: "CoreMessageCommandAccepted",
		piece: CoreMessageCommandAcceptedListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreMessageCommandTyping",
		piece: CoreMessageCommandTypingListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreMessageCreate",
		piece: CoreMessageCreateListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CorePrefixedMessage",
		piece: CorePrefixedMessageListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CorePreMessageCommandRun",
		piece: CorePreMessageCommandRunListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CorePreMessageParser",
		piece: CorePreMessageParserListener,
		store,
	});
}
