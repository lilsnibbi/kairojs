/**
 * Editable message commands: a command's answer is remembered, so editing the invocation edits the
 * answer instead of producing a second one.
 *
 * Two halves make that work — {@link send} and {@link reply}, which a command uses in place of
 * `message.channel.send`, and a listener that feeds edited messages back into the command pipeline.
 * Call {@link loadEditableCommandsListeners} once to install the latter.
 *
 * @since 1.0.0
 */

export * from "./lib/responseCache.ts";
export * from "./lib/send.ts";
export * from "./listeners/index.ts";
export * from "./listeners/messageUpdate.ts";
