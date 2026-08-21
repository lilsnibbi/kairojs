import type {
	IMessagePrompterExplicitNumberReturn,
	IMessagePrompterNumberStrategyOptions,
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
} from "@types";
import type {
	CollectorFilter,
	EmojiIdentifierResolvable,
	MessageReaction,
	User,
} from "discord.js";
import { MessagePrompterBaseStrategy } from "./messagePrompterBaseStrategy.ts";

/**
 * Asks the user to pick a whole number by offering one keycap emoji per value in the range.
 *
 * Discord only has keycap emoji for `0` through `10`, which is why the range is capped there.
 *
 * @since 1.0.0
 */
export class MessagePrompterNumberStrategy
	extends MessagePrompterBaseStrategy
	implements IMessagePrompterNumberStrategyOptions
{
	/**
	 * The emoji used for each number, in ascending order.
	 */
	public numberEmojis: EmojiIdentifierResolvable[];

	/**
	 * The lowest number offered, inclusive.
	 */
	public start: number;

	/**
	 * The highest number offered, inclusive.
	 */
	public end: number;

	/**
	 * @param message The question to display.
	 * @param options Overrides for the range, the emoji set and the shared strategy options.
	 */
	public constructor(
		message: MessagePrompterMessage,
		options: IMessagePrompterNumberStrategyOptions,
	) {
		super("number", message, options);

		this.numberEmojis =
			options?.numberEmojis ?? MessagePrompterNumberStrategy.numberEmojis;
		this.start = options?.start ?? 0;
		this.end = options?.end ?? 10;
	}

	/**
	 * Sends the question and waits for a single reaction.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a predicate deciding which
	 * answers count.
	 * @returns The number the chosen emoji stands for, or the full result object when
	 * `explicitReturn` is on.
	 *
	 * @throws If the range falls outside `0` to `10`.
	 */
	public async run(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<[MessageReaction, User]>,
	): Promise<IMessagePrompterExplicitNumberReturn | number> {
		if (this.start < 0)
			throw new TypeError("Starting number cannot be less than 0.");
		if (this.end > 10)
			throw new TypeError("Ending number cannot be more than 10.");

		const numbers = Array.from(
			{ length: this.end - this.start + 1 },
			(_, offset: number) => offset + this.start,
		);
		const emojis = this.numberEmojis.slice(this.start, this.end);
		const response = await this.collectReactions(
			channel,
			authorOrFilter,
			emojis,
		);

		const chosenIndex = emojis.findIndex(
			(emoji) => (response?.emoji?.id ?? response?.emoji?.name) === emoji,
		);
		const number = numbers[chosenIndex]!;

		return this.explicitReturn ? { ...response, number } : number;
	}

	/**
	 * The keycap emoji new instances use when none are given, ordered from zero to ten.
	 */
	public static numberEmojis = [
		"0️⃣",
		"1️⃣",
		"2️⃣",
		"3️⃣",
		"4️⃣",
		"5️⃣",
		"6️⃣",
		"7️⃣",
		"8️⃣",
		"9️⃣",
		"🔟",
	];
}
