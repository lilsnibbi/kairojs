import type {
	MessageBuilderFileResolvable,
	MessageBuilderResolvable,
} from "@types";
import type { MessageCreateOptions } from "discord.js";

/**
 * A chainable way to assemble the options object discord.js takes when creating a message.
 *
 * Because it implements `MessageCreateOptions` itself, an instance can be handed straight to
 * `channel.send(...)` — there is no `toJSON` step to remember.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { MessageBuilder } from "kairojs/utilities/discord.js-utilities";
 * import { EmbedBuilder } from "discord.js";
 *
 * const message = new MessageBuilder()
 *   .setContent("Here you go")
 *   .setEmbeds([new EmbedBuilder().setDescription("An embed")]);
 *
 * await channel.send(message);
 * ```
 */
export class MessageBuilder implements MessageCreateOptions {
	/**
	 * Whether Discord should read the message aloud to anybody focused on the channel.
	 *
	 * @default false
	 */
	public tts?: MessageCreateOptions["tts"];

	/**
	 * A value echoed back on the created message, letting you match your own send call to the
	 * message Discord ends up producing.
	 *
	 * @default ''
	 */
	public nonce?: MessageCreateOptions["nonce"];

	/**
	 * The message text. Leaving this undefined and using the builder to edit means the existing
	 * content is kept rather than cleared.
	 */
	public content?: MessageCreateOptions["content"];

	/**
	 * The embeds to attach, at most ten. Leaving this undefined and using the builder to edit means
	 * the existing embeds are kept rather than cleared.
	 */
	public embeds?: MessageCreateOptions["embeds"];

	/**
	 * The action rows to attach. Leaving this undefined and using the builder to edit means the
	 * existing components are kept rather than cleared.
	 */
	public components?: MessageCreateOptions["components"];

	/**
	 * Which mentions in {@link MessageBuilder.content} Discord should actually resolve into pings.
	 */
	public allowedMentions?: MessageCreateOptions["allowedMentions"];

	/**
	 * The files to upload alongside the message. Do not set this when editing — Discord does not
	 * allow an existing message's attachments to be changed.
	 */
	public files?: MessageCreateOptions["files"];

	/**
	 * @param options Initial values. Anything left out falls back to {@link MessageBuilder.defaults}.
	 */
	public constructor(options?: MessageBuilderResolvable) {
		this.tts = options?.tts ?? MessageBuilder.defaults.tts;
		this.nonce = options?.nonce ?? MessageBuilder.defaults.nonce;
		this.content = options?.content ?? MessageBuilder.defaults.content;
		this.embeds = options?.embeds ?? MessageBuilder.defaults.embeds;
		this.components = options?.components ?? MessageBuilder.defaults.components;
		this.allowedMentions =
			options?.allowedMentions ?? MessageBuilder.defaults.allowedMentions;
		this.files = options?.files ?? MessageBuilder.defaults.files;
	}

	/**
	 * Sets {@link MessageBuilder.tts}.
	 *
	 * @param tts Whether the message should be read aloud.
	 */
	public setTTS(tts?: boolean): this {
		this.tts = tts;
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.nonce}.
	 *
	 * @param nonce The value to echo back on the created message.
	 */
	public setNonce(nonce?: string): this {
		this.nonce = nonce;
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.content}.
	 *
	 * @param content The message text, or `undefined` to leave existing content untouched when
	 * editing.
	 */
	public setContent(content?: string): this {
		this.content = content;
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.embeds}.
	 *
	 * @remarks More than ten embeds is silently truncated to the first ten rather than rejected.
	 *
	 * @param embeds The embeds to attach, or `undefined` to leave existing embeds untouched when
	 * editing.
	 */
	public setEmbeds(embeds?: MessageCreateOptions["embeds"]): this {
		if (embeds && embeds.length > 10) {
			embeds = embeds.slice(0, 10);
		}

		this.embeds = embeds;
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.components}.
	 *
	 * @param components The action rows to attach, or `undefined` to leave existing components
	 * untouched when editing.
	 */
	public setComponents(components?: MessageCreateOptions["components"]): this {
		this.components = components;
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.allowedMentions}.
	 *
	 * @param allowedMentions Which mentions Discord should resolve into pings.
	 */
	public setAllowedMentions(
		allowedMentions?: MessageCreateOptions["allowedMentions"],
	): this {
		this.allowedMentions = allowedMentions;
		return this;
	}

	/**
	 * Appends one entry to {@link MessageBuilder.files}, creating the array if it does not exist yet.
	 *
	 * @param file The file to add.
	 */
	public addFile(file: MessageBuilderFileResolvable): this {
		this.files = this.files?.concat(file) ?? [file];
		return this;
	}

	/**
	 * Replaces {@link MessageBuilder.files} with a single entry.
	 *
	 * @param file The only file to upload. Do not use this when editing — Discord does not allow an
	 * existing message's attachments to be changed.
	 */
	public setFile(file: MessageBuilderFileResolvable): this {
		this.files = [file];
		return this;
	}

	/**
	 * Sets {@link MessageBuilder.files}.
	 *
	 * @param files The files to upload. Do not use this when editing — Discord does not allow an
	 * existing message's attachments to be changed.
	 */
	public setFiles(files?: MessageBuilderFileResolvable[]): this {
		this.files = files;
		return this;
	}

	/**
	 * Values every new instance starts from. Assign to this once during start-up to give every
	 * builder in your bot the same baseline.
	 */
	public static defaults: MessageBuilderResolvable = {};
}
