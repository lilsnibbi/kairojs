import type {
	IMessagePrompterConfirmStrategyOptions,
	IMessagePrompterExplicitConfirmReturn,
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
} from "@types";
import type {
	CollectorFilter,
	EmojiResolvable,
	MessageReaction,
	User,
} from "discord.js";
import { MessagePrompterBaseStrategy } from "./messagePrompterBaseStrategy.ts";

/**
 * Asks a yes/no question by offering exactly two emoji and reporting which one was picked.
 *
 * @since 1.0.0
 */
export class MessagePrompterConfirmStrategy
	extends MessagePrompterBaseStrategy
	implements IMessagePrompterConfirmStrategyOptions
{
	/**
	 * The emoji standing for "yes".
	 */
	public confirmEmoji: string | EmojiResolvable;

	/**
	 * The emoji standing for "no".
	 */
	public cancelEmoji: string | EmojiResolvable;

	/**
	 * @param message The question to display.
	 * @param options Overrides for the emoji pair and the shared strategy options.
	 */
	public constructor(
		message: MessagePrompterMessage,
		options?: IMessagePrompterConfirmStrategyOptions,
	) {
		super("confirm", message, options);

		this.confirmEmoji =
			options?.confirmEmoji ?? MessagePrompterConfirmStrategy.confirmEmoji;
		this.cancelEmoji =
			options?.cancelEmoji ?? MessagePrompterConfirmStrategy.cancelEmoji;
	}

	/**
	 * Sends the question and waits for a single reaction.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns `true` when the confirm emoji was picked and `false` otherwise, or the full result
	 * object when `explicitReturn` is on.
	 */
	public override async run(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<[MessageReaction, User]>,
	): Promise<IMessagePrompterExplicitConfirmReturn | boolean> {
		const response = await this.collectReactions(channel, authorOrFilter, [
			this.confirmEmoji,
			this.cancelEmoji,
		]);

		const confirmed =
			(response?.emoji?.id ?? response?.emoji?.name) === this.confirmEmoji;

		return this.explicitReturn ? { ...response, confirmed } : confirmed;
	}

	/**
	 * The emoji new instances use for "yes" when none is given.
	 */
	public static confirmEmoji: string | EmojiResolvable = "🇾";

	/**
	 * The emoji new instances use for "no" when none is given.
	 */
	public static cancelEmoji: string | EmojiResolvable = "🇳";
}
