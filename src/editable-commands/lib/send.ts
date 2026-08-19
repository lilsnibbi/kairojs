import {
	DiscordAPIError,
	MessagePayload,
	RESTJSONErrorCodes,
	type Message,
	type MessagePayloadOption,
} from "discord.js";
import type { EditableMessageOptions } from "@types";
import {
	freeEditableResponse,
	getEditableResponse,
	trackEditableResponse,
} from "./response-cache.ts";

/**
 * Responds to a message, editing the previous response if one was already sent for it.
 *
 * This is what makes a command editable: run `!ping`, get a reply, then edit `!ping` into `!pong`
 * and the bot rewrites its own answer rather than posting a second one. Use it anywhere a command
 * would otherwise call `message.channel.send`.
 *
 * @param message The message being responded to.
 * @param options The response, in the same shape `TextBasedChannel#send` accepts.
 * @returns The message the bot sent or edited.
 *
 * @example
 * ```typescript
 * import { Command, send } from "kairojs";
 *
 * export class PingCommand extends Command {
 *   public messageRun(message: Message) {
 *     return send(message, "Pong!");
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function send(
	message: Message,
	options: string | EditableMessageOptions,
): Promise<Message> {
	return respond(message, options);
}

/**
 * Responds to a message as an inline reply, editing the previous response if one was already sent
 * for it.
 *
 * Identical to {@link send} other than the reply reference; note that editing a message cannot
 * change what it replies to, so the reference only applies the first time round.
 *
 * @param message The message being replied to.
 * @param options The response, in the same shape `TextBasedChannel#send` accepts.
 * @returns The message the bot sent or edited.
 *
 * @since 1.0.0
 */
export function reply(
	message: Message,
	options: string | EditableMessageOptions,
): Promise<Message> {
	const failIfNotExists =
		typeof options === "string"
			? message.client.options.failIfNotExists
			: (Reflect.get(options, "failIfNotExists") ??
				message.client.options.failIfNotExists);

	return respond(message, options, {
		reply: { messageReference: message, failIfNotExists },
	});
}

/**
 * Resolves the payload, then either edits the tracked response or sends a new one, tracking whatever
 * comes back.
 *
 * @param message The message being responded to.
 * @param options The response.
 * @param extra Payload fields that only apply when the response is sent rather than edited.
 */
async function respond(
	message: Message,
	options: string | EditableMessageOptions,
	extra?: MessagePayloadOption,
) {
	const existing = getEditableResponse(message);
	const payloadOptions = existing
		? resolveEditPayload(existing, options)
		: resolveSendPayload(options);
	const payload = await MessagePayload.create(
		message.channel,
		payloadOptions,
		extra,
	)
		.resolveBody()
		.resolveFiles();

	const response = await (existing
		? editOrResend(message, existing, payload)
		: sendPayload(message, payload));
	trackEditableResponse(message, response);

	return response;
}

/**
 * Posts a fresh response in the channel the message came from.
 *
 * Not every channel a message can be read from can be written to — a partial group DM, for one — so
 * the channel is checked rather than assumed.
 */
function sendPayload(message: Message, payload: MessagePayload) {
	if (!message.channel.isSendable()) {
		throw new TypeError(
			`Cannot respond to the message '${message.id}': its channel cannot be sent to.`,
		);
	}

	return message.channel.send(payload);
}

/**
 * Normalises the caller's options into a payload.
 *
 * Components are defaulted to an empty array so that a response which no longer has any buttons
 * actually loses them on edit, rather than silently keeping the previous set.
 */
function resolveSendPayload(
	options: string | EditableMessageOptions,
): MessagePayloadOption {
	return typeof options === "string"
		? { content: options, components: [] }
		: { components: [], ...options };
}

/**
 * Normalises the caller's options into an edit payload.
 *
 * Discord treats an omitted field as "leave unchanged", so anything the previous response carried
 * has to be explicitly emptied for it to disappear.
 */
function resolveEditPayload(
	response: Message,
	options: string | EditableMessageOptions,
): MessagePayloadOption {
	const payload = resolveSendPayload(options) as Extract<
		MessagePayloadOption,
		{ attachments?: unknown }
	>;

	if (response.embeds.length) payload.embeds ??= [];
	if (response.attachments.size) payload.attachments ??= [];

	return payload;
}

/**
 * Edits the tracked response, falling back to sending a new one if it turns out to have been deleted
 * in the meantime.
 */
async function editOrResend(
	message: Message,
	response: Message,
	payload: MessagePayload,
) {
	try {
		return await response.edit(payload);
	} catch (error) {
		if (!(error instanceof DiscordAPIError)) throw error;
		if (error.code !== RESTJSONErrorCodes.UnknownMessage) throw error;

		freeEditableResponse(message);
		return sendPayload(message, payload);
	}
}
