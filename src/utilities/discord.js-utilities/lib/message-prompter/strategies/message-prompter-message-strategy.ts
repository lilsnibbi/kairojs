import type {
	ArgumentTypes,
	IMessagePrompterExplicitMessageReturn,
	IMessagePrompterStrategyOptions,
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
} from "@types";
import { isNullish } from "@utilities/utilities/index.ts";
import type {
	CollectorFilter,
	CollectorOptions,
	Message,
	User,
} from "discord.js";
import { isStageChannel, isTextBasedChannel } from "../../type-guards.ts";
import { MessagePrompterBaseStrategy } from "./message-prompter-base-strategy.ts";

/**
 * Asks a question and waits for the user to write a message back, rather than to react.
 *
 * Use this whenever the answer is free-form — a block of text, a URL, or an uploaded file.
 *
 * @since 1.0.0
 */
export class MessagePrompterMessageStrategy
	extends MessagePrompterBaseStrategy
	implements IMessagePrompterStrategyOptions
{
	/**
	 * @param message The question to display.
	 * @param options Overrides for the shared strategy options.
	 */
	public constructor(
		message: MessagePrompterMessage,
		options: IMessagePrompterStrategyOptions,
	) {
		super("message", message, options);
	}

	/**
	 * Sends the question and waits for a single message.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns The message the user sent, or the full result object when `explicitReturn` is on.
	 *
	 * @throws If the channel cannot receive messages, or if nobody answered in time.
	 */
	public override async run(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<[Message]>,
	): Promise<IMessagePrompterExplicitMessageReturn | Message> {
		if (isTextBasedChannel(channel) && !isStageChannel(channel)) {
			if (!isNullish(this.editMessage) && this.editMessage.editable) {
				this.appliedMessage = await this.editMessage.edit(
					this.message as ArgumentTypes<Message["edit"]>[0],
				);
			} else {
				this.appliedMessage = await channel.send(this.message);
			}

			const collected = await channel.awaitMessages({
				...this.createMessagePromptFilter(authorOrFilter),
				max: 1,
				time: this.timeout,
				errors: ["time"],
			});
			const response = collected.first();

			if (!response) {
				throw new Error("No messages received");
			}

			return this.explicitReturn
				? {
						response,
						strategy: this,
						appliedMessage: this.appliedMessage,
						message: this.message,
					}
				: response;
		}

		throw new Error(
			"A channel was provided to which I am not able to send messages",
		);
	}

	/**
	 * Builds the collector options that keep out everything except a message from the right person
	 * who is not a bot.
	 *
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns Collector options carrying the assembled filter.
	 */
	private createMessagePromptFilter(
		authorOrFilter: User | CollectorFilter<[Message]>,
	): CollectorOptions<[Message]> {
		return {
			filter: async (message: Message) =>
				(typeof authorOrFilter === "function"
					? await authorOrFilter(message)
					: message.author.id === authorOrFilter.id) && !message.author.bot,
		};
	}
}
