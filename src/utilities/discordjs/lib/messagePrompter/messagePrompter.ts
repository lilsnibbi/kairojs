import type {
	MessagePrompterChannelTypes,
	MessagePrompterMessage,
	MessagePrompterStrategyConstructor,
	StrategyFilters,
	StrategyOptions,
	StrategyReturns,
} from "@types";
import type { CollectorFilter, User } from "discord.js";
import { MessagePrompterBaseStrategy } from "./strategies/messagePrompterBaseStrategy.ts";
import { MessagePrompterConfirmStrategy } from "./strategies/messagePrompterConfirmStrategy.ts";
import { MessagePrompterMessageStrategy } from "./strategies/messagePrompterMessageStrategy.ts";
import { MessagePrompterNumberStrategy } from "./strategies/messagePrompterNumberStrategy.ts";
import { MessagePrompterReactionStrategy } from "./strategies/messagePrompterReactionStrategy.ts";

/**
 * Sends a message that asks the user something and resolves with their answer.
 *
 * Four ways of asking ship out of the box, each picked by name:
 *
 * - `confirm` offers a yes/no pair of reactions and resolves with a boolean.
 * - `number` offers one keycap reaction per value in a range — `0` to `10` unless you narrow it —
 *   and resolves with the number chosen.
 * - `reaction` offers whichever emoji you hand it and resolves with the one that was picked.
 * - `message` waits for the user to write something back, which is what you want for free-form
 *   text or an upload.
 *
 * Use this class directly or extend it. The strategy registry and the default strategy name are
 * both static, so a single assignment during start-up changes the behaviour of every prompt in
 * your bot.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { MessagePrompter } from "kairojs/utilities/discordjs";
 *
 * const prompter = new MessagePrompter("Are you sure you want to continue?");
 * const confirmed = await prompter.run(channel, author);
 * ```
 *
 * @example
 * ```typescript
 * import { MessagePrompter } from "kairojs/utilities/discordjs";
 *
 * const prompter = new MessagePrompter("Pick a number between 5 and 10", "number", { start: 5, end: 10 });
 * const chosen = await prompter.run(channel, author);
 * ```
 *
 * @example
 * ```typescript
 * import { MessagePrompter } from "kairojs/utilities/discordjs";
 *
 * const prompter = new MessagePrompter("Happy or sad?", "reaction", { reactions: ["🙂", "🙁"] });
 * const mood = await prompter.run(channel, author);
 * ```
 *
 * @example
 * ```typescript
 * import { MessagePrompter } from "kairojs/utilities/discordjs";
 *
 * const prompter = new MessagePrompter("What should I call you?", "message");
 * const reply = await prompter.run(channel, author);
 * ```
 */
export class MessagePrompter<S extends keyof StrategyReturns = "confirm"> {
	/**
	 * The strategy {@link MessagePrompter.run} delegates to.
	 */
	public strategy: MessagePrompterBaseStrategy;

	/**
	 * @param message Either the content to prompt with, or a fully constructed strategy to use
	 * as-is — in which case `strategy` and `strategyOptions` are ignored.
	 * @param strategy The name of the strategy to build. Defaults to
	 * {@link MessagePrompter.defaultStrategy}.
	 * @param strategyOptions The options handed to the strategy being built.
	 *
	 * @throws If `strategy` names something that is not in {@link MessagePrompter.strategies}.
	 */
	public constructor(
		message: MessagePrompterMessage | MessagePrompterBaseStrategy,
		strategy?: S,
		strategyOptions?: S extends keyof StrategyOptions
			? StrategyOptions[S]
			: never,
	) {
		let resolvedStrategy: MessagePrompterBaseStrategy;

		if (message instanceof MessagePrompterBaseStrategy) {
			resolvedStrategy = message;
		} else {
			const registeredStrategy = MessagePrompter.strategies.get(
				strategy ?? MessagePrompter.defaultStrategy,
			);

			if (!registeredStrategy) {
				throw new Error("No strategy provided");
			}

			resolvedStrategy = new registeredStrategy(message, strategyOptions);
		}

		this.strategy = resolvedStrategy;
	}

	/**
	 * Sends the prompt and waits for the answer.
	 *
	 * @param channel The channel to prompt in.
	 * @param authorOrFilter Either the only user allowed to answer, or a
	 * {@linkplain https://discord.js.org/docs/packages/discord.js/main/CollectorFilter:TypeAlias CollectorFilter}
	 * deciding which answers count.
	 */
	public run<
		Filter extends S extends keyof StrategyFilters
			? StrategyFilters[S]
			: unknown[],
	>(
		channel: MessagePrompterChannelTypes,
		authorOrFilter: User | CollectorFilter<Filter>,
	): S extends keyof StrategyReturns ? Promise<StrategyReturns[S]> : never {
		return this.strategy.run(
			channel,
			authorOrFilter as User | CollectorFilter<unknown[]>,
		) as S extends keyof StrategyReturns ? Promise<StrategyReturns[S]> : never;
	}

	/**
	 * Every strategy that can be named in the constructor. Add your own entries here to make a
	 * custom strategy addressable by name.
	 */
	public static readonly strategies = new Map<
		keyof StrategyReturns,
		MessagePrompterStrategyConstructor
	>([
		[
			"confirm",
			MessagePrompterConfirmStrategy as MessagePrompterStrategyConstructor,
		],
		[
			"number",
			MessagePrompterNumberStrategy as MessagePrompterStrategyConstructor,
		],
		[
			"reaction",
			MessagePrompterReactionStrategy as MessagePrompterStrategyConstructor,
		],
		[
			"message",
			MessagePrompterMessageStrategy as MessagePrompterStrategyConstructor,
		],
	]);

	/**
	 * The strategy used when the constructor is not told which one to build.
	 */
	public static defaultStrategy: keyof StrategyReturns = "confirm";
}
