import type {
	ArgumentContext,
	ArgumentErrorOptions,
	ArgumentOptions,
	ArgumentResult,
	AwaitableArgumentResult,
	PieceLoaderContext,
} from "@types";
import { AliasPiece } from "@/loader/aliasPiece.ts";
import { Args } from "@/parsers/args.ts";

/**
 * A named parser that turns one raw word of a message command into a real value.
 *
 * Arguments are what {@link Args} reaches for: `args.pick("url")` looks up the argument registered
 * under `url` and hands it the next parameter. Because they are pieces, one parser is written once
 * and every command gets it — including the failure message it produces when the text does not fit.
 *
 * A parser never throws to signal a bad parameter. It returns {@link Argument.ok} or
 * {@link Argument.error}, so a caller can try one argument, fall back to another, and only surface a
 * message once every candidate has been exhausted.
 *
 * @example
 * ```typescript
 * import { Argument, type PieceLoaderContext } from "kairojs";
 *
 * export class HyperlinkArgument extends Argument<URL> {
 *   public constructor(context: PieceLoaderContext<"arguments">) {
 *     super(context, { name: "hyperlink", aliases: ["url"] });
 *   }
 *
 *   public run(parameter: string, context: ArgumentContext<URL>) {
 *     try {
 *       return this.ok(new URL(parameter));
 *     } catch {
 *       return this.error({
 *         parameter,
 *         context,
 *         identifier: "ArgumentHyperlinkInvalidURL",
 *         message: "The argument did not resolve to a valid URL."
 *       });
 *     }
 *   }
 * }
 *
 * // Teach `args.pick("url")` and friends that they now return a `URL`.
 * declare module "kairojs" {
 *   interface ArgType {
 *     url: URL;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class Argument<
	T = unknown,
	Options extends ArgumentOptions = ArgumentOptions,
> extends AliasPiece<Options, "arguments"> {
	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The name and aliases this parser is reachable under.
	 */
	public constructor(
		context: PieceLoaderContext<"arguments">,
		options: Options = {} as Options,
	) {
		super(context, options);
	}

	/**
	 * Turns one raw parameter into a value.
	 *
	 * @param parameter The text to parse.
	 * @param context The message, command and bounds this parse is happening under.
	 */
	public abstract run(
		parameter: string,
		context: ArgumentContext<T>,
	): AwaitableArgumentResult<T>;

	/**
	 * Reports a successful parse.
	 *
	 * @param value The parsed value.
	 */
	public ok(value: T): ArgumentResult<T> {
		return Args.ok(value);
	}

	/**
	 * Reports a failed parse as an {@link ArgumentError} naming this argument.
	 *
	 * The identifier defaults to the argument's own name, which is usually the right key to branch
	 * on; pass one explicitly to distinguish several ways the same parser can fail.
	 *
	 * @param options The rejected parameter and the usual error details.
	 */
	public error(
		options: Omit<ArgumentErrorOptions<T>, "argument">,
	): ArgumentResult<T> {
		return Args.error({ argument: this, identifier: this.name, ...options });
	}
}
