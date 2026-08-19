import type {
	MessageCreateOptions,
	MessageEditOptions,
	MessageReplyOptions,
} from "discord.js";

/**
 * What an editable response may be given as.
 *
 * The three shapes are unified because the same call has to work whether it ends up creating a
 * message, replying to one, or editing a response that already exists — which of the three happens
 * is decided at call time, not by the caller.
 *
 * @since 1.0.0
 */
export type EditableMessageOptions =
	| MessageCreateOptions
	| MessageReplyOptions
	| MessageEditOptions;
