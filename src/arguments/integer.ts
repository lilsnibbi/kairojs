import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveInteger } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a whole number within the bounds the context supplies. A fractional parameter is turned
 * away rather than rounded, so a command never silently acts on a different value than was typed.
 *
 * @since 1.0.0
 */
export class CoreIntegerArgument extends Argument<number> {
	/**
	 * The wording for each way this parse can fail, so an out-of-range value names the bound it
	 * crossed rather than only reporting that it was rejected.
	 */
	private readonly messages = {
		[Identifiers.ArgumentIntegerTooSmall]: ({
			minimum,
		}: ArgumentContext<number>) =>
			`The given number must be greater than ${minimum}.`,
		[Identifiers.ArgumentIntegerTooLarge]: ({
			maximum,
		}: ArgumentContext<number>) =>
			`The given number must be less than ${maximum}.`,
		[Identifiers.ArgumentIntegerError]: () =>
			"The argument did not resolve to a valid number.",
	} as const;

	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "integer" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<number>,
	): ArgumentResult<number> {
		return resolveInteger(parameter, {
			minimum: context.minimum,
			maximum: context.maximum,
		}).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: this.messages[identifier](context),
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "integer",
	piece: CoreIntegerArgument,
	store: "arguments",
});
