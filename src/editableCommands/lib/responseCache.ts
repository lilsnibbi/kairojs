import type { Message } from "discord.js";

/**
 * Maps a user's message to the reply the bot sent for it.
 *
 * A `WeakMap` rather than an id-keyed cache with a size limit: the key is the message object
 * discord.js already holds, so an entry lives exactly as long as discord.js keeps that message
 * cached and disappears with it. That bounds the cache without a capacity to tune and without ever
 * evicting a message the bot could still be asked to edit.
 */
const responses = new WeakMap<Message, Message>();

/**
 * Remembers that `response` was sent in answer to `message`, so a later {@link send} or
 * {@link reply} for the same message edits it instead of posting again.
 *
 * @param message The user's message.
 * @param response The reply the bot sent for it.
 *
 * @since 1.0.0
 */
export function trackEditableResponse(
	message: Message,
	response: Message,
): void {
	responses.set(message, response);
}

/**
 * Forgets the reply tracked for a message, so the next response is posted fresh.
 *
 * @param message The user's message.
 * @returns Whether a reply was being tracked.
 *
 * @since 1.0.0
 */
export function freeEditableResponse(message: Message): boolean {
	return responses.delete(message);
}

/**
 * Looks up the reply tracked for a message.
 *
 * @param message The user's message.
 * @returns The tracked reply, or `null` if none was tracked.
 *
 * @since 1.0.0
 */
export function getEditableResponse(message: Message): Message | null {
	return responses.get(message) ?? null;
}
