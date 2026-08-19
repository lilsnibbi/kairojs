import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveFloat } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a decimal number within the bounds the context supplies.
 *
 * The parse itself is the same as `number`; only the wording and the identifiers differ, which lets
 * a bot phrase a rejected decimal differently from a rejected number.
 *
 * @since 1.0.0
 */
export class CoreFloatArgument extends Argument<number> {
	/**
	 * The wording for each way this parse can fail, so an out-of-range value names the bound it
	 * crossed rather than only reporting that it was rejected.
	 */
	private readonly messages = {
		[Identifiers.ArgumentFloatTooSmall]: ({
			minimum,
		}: ArgumentContext<number>) =>
			`The given number must be greater than ${minimum}.`,
		[Identifiers.ArgumentFloatTooLarge]: ({
			maximum,
		}: ArgumentContext<number>) =>
			`The given number must be less than ${maximum}.`,
		[Identifiers.ArgumentFloatError]: () =>
			"The argument did not resolve to a valid decimal.",
	} as const;

	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "float" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<number>,
	): ArgumentResult<number> {
		return resolveFloat(parameter, {
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
	name: "float",
	piece: CoreFloatArgument,
	store: "arguments",
});
