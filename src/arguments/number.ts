import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveNumber } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a number, whole or fractional, within the bounds the context supplies.
 *
 * @since 1.0.0
 */
export class CoreNumberArgument extends Argument<number> {
	/**
	 * The wording for each way this parse can fail, so an out-of-range value names the bound it
	 * crossed rather than only reporting that it was rejected.
	 */
	private readonly messages = {
		[Identifiers.ArgumentNumberTooSmall]: ({
			minimum,
		}: ArgumentContext<number>) =>
			`The given number must be greater than ${minimum}.`,
		[Identifiers.ArgumentNumberTooLarge]: ({
			maximum,
		}: ArgumentContext<number>) =>
			`The given number must be less than ${maximum}.`,
		[Identifiers.ArgumentNumberError]: () =>
			"The argument did not resolve to a valid number.",
	} as const;

	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "number" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<number>,
	): ArgumentResult<number> {
		return resolveNumber(parameter, {
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
	name: "number",
	piece: CoreNumberArgument,
	store: "arguments",
});
