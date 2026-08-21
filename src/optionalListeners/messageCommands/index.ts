import { container } from "@/container.ts";
import { CoreMessageCommandAcceptedListener } from "./messageCommandAccepted.ts";
import { CoreMessageCommandTypingListener } from "./messageCommandTyping.ts";
import { CoreMessageCreateListener } from "./messageCreate.ts";
import { CorePreMessageCommandRunListener } from "./preMessageCommandRun.ts";
import { CorePreMessageParserListener } from "./preMessageParser.ts";
import { CorePrefixedMessageListener } from "./prefixedMessage.ts";

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
