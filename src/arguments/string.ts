import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveString } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Passes a parameter through once its length falls inside the bounds the context supplies. Given no
 * bounds it always succeeds, which makes it the parser to reach for when any text will do.
 *
 * @since 1.0.0
 */
export class CoreStringArgument extends Argument<string> {
	/**
	 * The wording for each way this check can fail, so the message names the bound that was crossed.
	 */
	private readonly messages = {
		[Identifiers.ArgumentStringTooShort]: ({
			minimum,
		}: ArgumentContext<string>) =>
			`The argument must be longer than ${minimum} characters.`,
		[Identifiers.ArgumentStringTooLong]: ({
			maximum,
		}: ArgumentContext<string>) =>
			`The argument must be shorter than ${maximum} characters.`,
	} as const;

	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "string" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<string>,
	): ArgumentResult<string> {
		return resolveString(parameter, {
			minimum: context?.minimum,
			maximum: context?.maximum,
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
	name: "string",
	piece: CoreStringArgument,
	store: "arguments",
});
