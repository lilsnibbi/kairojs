import type {
	IMessagePrompterExplicitReturnBase,
	IMessagePrompterReactionStrategyOptions,
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
} from "@types";
import type {
	CollectorFilter,
	EmojiIdentifierResolvable,
	EmojiResolvable,
	MessageReaction,
	User,
} from "discord.js";
import { MessagePrompterBaseStrategy } from "./message-prompter-base-strategy.ts";

/**
 * Offers an arbitrary set of emoji and reports back which one the user picked.
 *
 * This is the open-ended sibling of the confirm and number strategies: use it whenever the answer
 * is one of several choices that are neither yes/no nor numeric.
 *
 * @since 1.0.0
 */
export class MessagePrompterReactionStrategy
	extends MessagePrompterBaseStrategy
	implements IMessagePrompterReactionStrategyOptions
{
	/**
	 * The emoji being offered.
	 */
	public reactions: EmojiIdentifierResolvable[];

	/**
	 * @param message The question to display.
	 * @param options The emoji to offer, plus the shared strategy options.
	 */
	public constructor(
		message: MessagePrompterMessage,
		options: IMessagePrompterReactionStrategyOptions,
	) {
		super("reactions", message, options);

		this.reactions = options?.reactions;
	}

	/**
	 * Sends the question and waits for a single reaction.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns The emoji that was picked, or the full result object when `explicitReturn` is on.
	 *
	 * @throws If no emoji were offered.
	 */
	public async run(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<[MessageReaction, User]>,
	): Promise<IMessagePrompterExplicitReturnBase | string | EmojiResolvable> {
		if (!this.reactions?.length)
			throw new TypeError("There are no reactions provided.");

		const response = await this.collectReactions(
			channel,
			authorOrFilter,
			this.reactions,
		);

		return this.explicitReturn ? response : (response.reaction ?? response);
	}
}
