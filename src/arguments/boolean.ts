import type {
	ArgumentResult,
	BooleanArgumentContext,
	PieceLoaderContext,
} from "@types";
import { container } from "@/container.ts";
import { resolveBoolean } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses the spellings of `true` and `false` people actually type, rather than only the two words
 * themselves. A command may widen the accepted vocabulary through the context.
 *
 * @since 1.0.0
 */
export class CoreBooleanArgument extends Argument<boolean> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "boolean" });
	}

	public run(
		parameter: string,
		context: BooleanArgumentContext,
	): ArgumentResult<boolean> {
		return resolveBoolean(parameter, {
			truths: context.truths,
			falses: context.falses,
		}).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The argument did not resolve to a boolean.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "boolean",
	piece: CoreBooleanArgument,
	store: "arguments",
});
