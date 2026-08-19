import type { Awaitable, Message } from "discord.js";
import type { Args } from "@/parsers/args.ts";
import type { PatternCommandOptions, PieceLoaderContext } from "@types";
import { Command } from "./command.ts";

/**
 * The lowest weight a pattern command may claim.
 */
const MinimumWeight = 0;

/**
 * The highest weight a pattern command may claim.
 */
const MaximumWeight = 10;

/**
 * A command triggered by what a message says rather than by a prefix.
 *
 * Where a normal command waits to be invoked, a pattern command watches every message and fires when
 * its name or one of its aliases appears. Because several can match the same message, each carries a
 * `weight` deciding who gets first refusal and a `chance` deciding whether it takes it.
 *
 * @example
 * ```typescript
 * import { PatternCommand } from "kairojs";
 *
 * export class GreetingCommand extends PatternCommand {
 *   public constructor(context: PieceLoaderContext<"pattern-commands">) {
 *     super(context, { name: "hello", aliases: ["hi", "hey"], chance: 25, matchFullName: true });
 *   }
 *
 *   public messageRun(message: Message) {
 *     return message.reply("Hello!");
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class PatternCommand extends Command<
	Args,
	PatternCommandOptions
> {
	/**
	 * The percentage chance, from 1 to 100, that this command runs once it has matched.
	 */
	public readonly chance: number;

	/**
	 * How strongly this command claims a message when several match it, from 0 to 10.
	 */
	public readonly weight: number;

	/**
	 * Whether this command's name has to match a whole word rather than appearing anywhere.
	 */
	public readonly matchFullName: boolean;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The command's own options, plus the matching behaviour.
	 */
	public constructor(
		context: PieceLoaderContext<"pattern-commands">,
		options: PatternCommandOptions,
	) {
		super(context as unknown as PieceLoaderContext<"commands">, options);

		this.chance = options.chance ?? 100;
		this.matchFullName = options.matchFullName ?? false;

		// A weight of 0 is indistinguishable from an omitted one here, and both mean "use the
		// default" — this mirrors the original behaviour rather than treating 0 as a real value.
		this.weight = options.weight
			? Math.min(Math.max(options.weight, MinimumWeight), MaximumWeight)
			: 5;
	}

	/**
	 * Runs the command once its pattern has matched and it has won its chance roll.
	 *
	 * Unlike a normal message command there are no arguments to parse: the whole message is the
	 * trigger, so the handler is handed the message and nothing else.
	 *
	 * @param message The message that matched.
	 */
	public abstract override messageRun(message: Message): Awaitable<unknown>;
}
