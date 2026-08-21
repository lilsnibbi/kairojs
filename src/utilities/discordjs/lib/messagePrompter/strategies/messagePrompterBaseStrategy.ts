import type {
	ArgumentTypes,
	Awaitable,
	IMessagePrompterExplicitReturnBase,
	IMessagePrompterStrategyOptions,
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
} from "@types";
import { isNullish } from "@utilities/common/index.ts";
import type {
	CollectorFilter,
	CollectorOptions,
	EmojiIdentifierResolvable,
	Message,
	MessageReaction,
	User,
} from "discord.js";
import { isStageChannel, isTextBasedChannel } from "../../typeGuards.ts";

/**
 * The shared machinery behind every prompt strategy: it knows how to put the prompt on screen, how
 * to seed it with reactions and how to wait for exactly one answer.
 *
 * Extend this to invent a strategy of your own; the concrete strategies shipped here all do.
 *
 * @since 1.0.0
 */
export abstract class MessagePrompterBaseStrategy {
	/**
	 * The name this strategy is registered under, echoed back on explicit results.
	 */
	public type: string;

	/**
	 * How long, in milliseconds, the collector waits before giving up.
	 */
	public timeout: number;

	/**
	 * Whether `run` resolves with the full result object rather than just the answer.
	 */
	public explicitReturn: boolean;

	/**
	 * The message that ended up carrying the prompt, populated once `run` has sent or edited it.
	 */
	public appliedMessage: Message | null = null;

	/**
	 * The content this prompt will display.
	 */
	public message: MessagePrompterMessage;

	/**
	 * An existing message to edit into the prompt instead of sending a fresh one.
	 */
	public editMessage: Message | undefined;

	/**
	 * @param type The name this strategy is registered under.
	 * @param message The content this prompt will display.
	 * @param options Overrides for {@link MessagePrompterBaseStrategy.defaultStrategyOptions}.
	 */
	public constructor(
		type: string,
		message: MessagePrompterMessage,
		options?: IMessagePrompterStrategyOptions,
	) {
		this.type = type;
		this.timeout =
			options?.timeout ??
			MessagePrompterBaseStrategy.defaultStrategyOptions.timeout ??
			10 * 1000;
		this.explicitReturn =
			options?.explicitReturn ??
			MessagePrompterBaseStrategy.defaultStrategyOptions.explicitReturn ??
			false;
		this.editMessage =
			options?.editMessage ??
			MessagePrompterBaseStrategy.defaultStrategyOptions.editMessage ??
			undefined;
		this.message = message;
	}

	/**
	 * Sends the prompt and waits for the user's answer.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 */
	public abstract run(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<unknown[]>,
	): Awaitable<unknown>;

	/**
	 * Puts the prompt on screen, adds the given emoji to it and resolves with the first matching
	 * reaction.
	 *
	 * Reactions are added one at a time and the loop bails out the moment somebody answers, so a
	 * quick user is not kept waiting for emoji they are never going to click.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @param reactions The emoji to offer.
	 *
	 * @throws If the channel cannot receive messages, or if the collector ended empty-handed.
	 */
	protected async collectReactions(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<[MessageReaction, User]>,
		reactions: string[] | EmojiIdentifierResolvable[],
	): Promise<IMessagePrompterExplicitReturnBase> {
		if (isTextBasedChannel(channel) && !isStageChannel(channel)) {
			if (!isNullish(this.editMessage) && this.editMessage.editable) {
				this.appliedMessage = await this.editMessage.edit(
					this.message as ArgumentTypes<Message["edit"]>[0],
				);
			} else {
				this.appliedMessage = await channel.send(this.message);
			}

			const collector = this.appliedMessage.createReactionCollector({
				...this.createReactionPromptFilter(reactions, authorOrFilter),
				max: 1,
				time: this.timeout,
			});

			let settled = false;
			const answer = new Promise<MessageReaction>((resolve, reject) => {
				collector.on("collect", (collectedReaction) => {
					resolve(collectedReaction);
					settled = true;
					collector.stop();
				});

				collector.on("end", (collected) => {
					settled = true;
					if (!collected.size) reject(new Error("Collector has ended"));
				});
			});

			for (const reaction of reactions) {
				if (settled) break;

				await this.appliedMessage.react(reaction);
			}

			const firstReaction = await answer;
			const emoji = firstReaction?.emoji;

			const reaction = reactions.find(
				(candidate) => (emoji?.id ?? emoji?.name) === candidate,
			);

			return {
				emoji,
				reaction,
				strategy: this,
				appliedMessage: this.appliedMessage,
				message: this.message,
			};
		}

		throw new Error(
			"A channel was provided to which I am not able to send messages",
		);
	}

	/**
	 * Builds the collector options that keep out everything except an offered emoji, added by the
	 * right person, who is not a bot.
	 *
	 * @param reactions The emoji being offered.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns Collector options carrying the assembled filter.
	 */
	protected createReactionPromptFilter(
		reactions: string[] | EmojiIdentifierResolvable[],
		authorOrFilter: User | CollectorFilter<[MessageReaction, User]>,
	): CollectorOptions<[MessageReaction, User]> {
		return {
			filter: async (reaction: MessageReaction, user: User) =>
				reactions.includes(reaction.emoji.id ?? reaction.emoji.name ?? "") &&
				(typeof authorOrFilter === "function"
					? await authorOrFilter(reaction, user)
					: user.id === authorOrFilter.id) &&
				!user.bot,
		};
	}

	/**
	 * The values every strategy falls back to. Assign to this once during start-up to change the
	 * baseline for every prompt in your bot.
	 */
	public static defaultStrategyOptions: IMessagePrompterStrategyOptions = {
		timeout: 10 * 1000,
		explicitReturn: false,
		editMessage: undefined,
	};
}
