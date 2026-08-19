import type { Message } from "discord.js";
import type { Args } from "@/parsers/args.ts";
import type { ArgumentError } from "@/errors/argument-error.ts";
import type { UserError } from "@/errors/user-error.ts";
import type { Argument } from "@/structures/argument.ts";
import type {
	InteractionHandler,
	InteractionHandlerTypes as InteractionHandlerTypesConstant,
} from "@/structures/interaction-handler.ts";
import type { Result } from "@utilities/result/index.ts";
import type { MessageCommand, MessageCommandRunContext } from "./commands.d.ts";
import type { AliasPieceOptions, PieceJSON, PieceOptions } from "./loader.d.ts";
import type { UnwrapSome } from "./utilities/result.d.ts";
import type { Awaitable } from "./utilities/utilities.d.ts";

/* -------------------------------------------------------------------------- */
/*                                  Arguments                                  */
/* -------------------------------------------------------------------------- */

/**
 * The options an `Argument` is constructed with.
 *
 * Arguments are alias-capable, so a single parser can be reachable under several names — a
 * `hyperlink` argument answering to `url` as well, for instance.
 *
 * @since 1.0.0
 */
export interface ArgumentOptions extends AliasPieceOptions {}

/**
 * Everything an `Argument` is told about the parameter it was handed.
 *
 * The three optional bounds are what the numeric and length-checking arguments read; anything else
 * a caller passes through `args.pick("thing", { … })` lands here untouched, which is why the shape
 * stays open-ended.
 *
 * @since 1.0.0
 */
export interface ArgumentContext<T = unknown>
	extends Record<PropertyKey, unknown> {
	/**
	 * The argument doing the parsing.
	 */
	argument: Argument<T>;

	/**
	 * The argument stream the parameter was taken from.
	 */
	args: Args;

	/**
	 * The message that invoked the command.
	 */
	message: Message;

	/**
	 * The command being invoked.
	 */
	command: MessageCommand;

	/**
	 * The context that invocation is running under.
	 */
	commandContext: MessageCommandRunContext;

	/**
	 * The lowest value the parsed result may take.
	 */
	minimum?: number;

	/**
	 * The highest value the parsed result may take.
	 */
	maximum?: number;

	/**
	 * Whether `minimum` and `maximum` are themselves allowed.
	 */
	inclusive?: boolean;
}

/**
 * What an `Argument` returns once it has finished, synchronously: the parsed value, or the reason it
 * could not be produced.
 *
 * @since 1.0.0
 */
export type ArgumentResult<T> = Result<T, ArgumentError<T>>;

/**
 * An {@link ArgumentResult} that may still be pending. This is what `Argument#run` is allowed to
 * return, so a parser is free to be synchronous or to hit the network.
 *
 * @since 1.0.0
 */
export type AwaitableArgumentResult<T> = Awaitable<ArgumentResult<T>>;

/**
 * An {@link ArgumentResult} that is always pending, for an `Argument#run` declared `async`.
 *
 * @since 1.0.0
 */
export type AsyncArgumentResult<T> = Promise<ArgumentResult<T>>;

/* -------------------------------------------------------------------------- */
/*                                Preconditions                                */
/* -------------------------------------------------------------------------- */

/**
 * The options a `Precondition` is constructed with.
 *
 * @since 1.0.0
 */
export interface PreconditionOptions extends PieceOptions {
	/**
	 * Where this precondition sits in the global list, which every command is checked against before
	 * its own preconditions run. Lower numbers are checked first.
	 *
	 * Leave it `null` — the default — for a precondition that only applies to the commands that ask
	 * for it by name.
	 *
	 * @default null
	 */
	position?: number | null;
}

/**
 * What a precondition returns: an empty success, or the {@link UserError} explaining the refusal.
 * It may still be pending, so a precondition is free to hit a database.
 *
 * @since 1.0.0
 */
export type PreconditionResult = Awaitable<Result<unknown, UserError>>;

/**
 * A {@link PreconditionResult} that is always pending, for a handler declared `async`.
 *
 * @since 1.0.0
 */
export type AsyncPreconditionResult = Promise<Result<unknown, UserError>>;

/* -------------------------------------------------------------------------- */
/*                             Interaction handlers                            */
/* -------------------------------------------------------------------------- */

/**
 * Which kind of interaction a handler is interested in, derived from the runtime constant so the two
 * can never drift apart.
 *
 * @since 1.0.0
 */
export type InteractionHandlerTypes =
	(typeof InteractionHandlerTypesConstant)[keyof typeof InteractionHandlerTypesConstant];

/**
 * The options an `InteractionHandler` is constructed with.
 *
 * @since 1.0.0
 */
export interface InteractionHandlerOptions extends PieceOptions {
	/**
	 * The kind of interaction this handler answers. Every interaction of that kind reaches the
	 * handler's `parse`, which is where narrowing to a particular custom ID belongs.
	 */
	readonly interactionHandlerType: InteractionHandlerTypes;
}

/**
 * The shape produced by `InteractionHandler#toJSON`.
 *
 * @since 1.0.0
 */
export interface InteractionHandlerJSON extends PieceJSON {
	interactionHandlerType: InteractionHandlerTypes;
}

/**
 * The value a given handler's `parse` hands to its `run`, read straight off that handler's own
 * `parse` so a subclass never has to restate it.
 *
 * @since 1.0.0
 */
export type InteractionHandlerParseResult<Instance extends InteractionHandler> =
	UnwrapSome<Awaited<ReturnType<Instance["parse"]>>>;
