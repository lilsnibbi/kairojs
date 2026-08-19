import type { Interaction } from "discord.js";
import type {
	Awaitable,
	InteractionHandlerJSON,
	InteractionHandlerOptions,
	None,
	PieceLoaderContext,
	Some,
} from "@types";
import { none, some, type Option } from "@utilities/result/index.ts";
import { Piece } from "@/loader/piece.ts";

/**
 * The kinds of interaction a handler can register for.
 *
 * `Button`, `SelectMenu` and `ModalSubmit` are the narrow ones; `MessageComponent` covers buttons
 * and select menus at once, for a handler meant to serve both. `Autocomplete` exists so suggestions
 * can live in their own piece rather than inside the command they belong to.
 *
 * @since 1.0.0
 */
export const InteractionHandlerTypes = Object.freeze({
	Button: 0,
	SelectMenu: 1,
	ModalSubmit: 2,
	MessageComponent: 3,
	Autocomplete: 4,
} as const);

/**
 * A piece that answers one kind of component interaction: a button press, a select-menu choice, a
 * submitted modal, or an autocomplete request.
 *
 * Handling happens in two steps. {@link InteractionHandler.parse} decides whether the interaction is
 * this handler's business and, if it is, extracts whatever {@link InteractionHandler.run} will need
 * — usually by reading the component's custom ID. Only when `parse` returns a `Some` does `run`
 * happen, and it receives that `Some`'s value directly, so an ID is never parsed twice.
 *
 * @example
 * ```typescript
 * import { InteractionHandler, InteractionHandlerTypes, type PieceLoaderContext } from "kairojs";
 *
 * export class VoteButtonHandler extends InteractionHandler {
 *   public constructor(context: PieceLoaderContext<"interaction-handlers">) {
 *     super(context, { interactionHandlerType: InteractionHandlerTypes.Button });
 *   }
 *
 *   public override parse(interaction: ButtonInteraction) {
 *     if (!interaction.customId.startsWith("vote.")) return this.none();
 *     return this.some({ pollId: interaction.customId.slice("vote.".length) });
 *   }
 *
 *   public run(interaction: ButtonInteraction, { pollId }: InteractionHandlerParseResult<this>) {
 *     return interaction.reply({ content: `Voted in poll ${pollId}.`, ephemeral: true });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class InteractionHandler<
	Options extends InteractionHandlerOptions = InteractionHandlerOptions,
> extends Piece<Options, "interaction-handlers"> {
	/**
	 * The kind of interaction this handler answers.
	 */
	public readonly interactionHandlerType: InteractionHandlerOptions["interactionHandlerType"];

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options Which kind of interaction this handler answers.
	 */
	public constructor(
		context: PieceLoaderContext<"interaction-handlers">,
		options: Options,
	) {
		super(context, options);

		this.interactionHandlerType = options.interactionHandlerType;
	}

	/**
	 * Handles an interaction {@link InteractionHandler.parse} claimed.
	 *
	 * @param interaction The interaction to handle.
	 * @param parsedData Whatever `parse` put in its `Some`.
	 */
	public abstract run(interaction: Interaction, parsedData?: unknown): unknown;

	/**
	 * Decides whether this handler wants the interaction, and pre-computes anything
	 * {@link InteractionHandler.run} will need from it.
	 *
	 * Returning {@link InteractionHandler.some} claims the interaction and passes its value straight
	 * to `run`; returning {@link InteractionHandler.none} passes on it. The default claims every
	 * interaction of the registered kind, which is almost never what you want — override this to
	 * filter by custom ID.
	 *
	 * `parse` may be asynchronous, so a handler can look the ID up in a database and hand `run` the
	 * row rather than the ID.
	 *
	 * @param _interaction The interaction being offered.
	 */
	public parse(_interaction: Interaction): Awaitable<Option<unknown>> {
		return this.some();
	}

	/**
	 * Claims the interaction, optionally carrying a value through to {@link InteractionHandler.run}.
	 *
	 * @param data The value `run` should receive.
	 */
	public some(): Some<never>;
	public some<T>(data: T): Some<T>;
	public some<T>(data?: T): Some<T | undefined> {
		return some(data);
	}

	/**
	 * Passes on the interaction, leaving it to another handler.
	 */
	public none(): None {
		return none;
	}

	/**
	 * Defines how this handler is serialised by `JSON.stringify`.
	 */
	public override toJSON(): InteractionHandlerJSON {
		return {
			...super.toJSON(),
			interactionHandlerType: this.interactionHandlerType,
		};
	}
}
