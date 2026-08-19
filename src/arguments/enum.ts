import type {
	ArgumentResult,
	EnumArgumentContext,
	PieceLoaderContext,
} from "@types";
import { container } from "@/container.ts";
import { resolveEnum } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Checks a parameter against the fixed list of values the context supplies and hands it back
 * unchanged when it is one of them.
 *
 * @since 1.0.0
 */
export class CoreEnumArgument extends Argument<string> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "enum" });
	}

	public run(
		parameter: string,
		context: EnumArgumentContext,
	): ArgumentResult<string> {
		return resolveEnum(parameter, {
			enum: context.enum,
			caseInsensitive: context.caseInsensitive,
		}).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: `The argument must have one of the following values: ${context.enum?.join(", ")}`,
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "enum",
	piece: CoreEnumArgument,
	store: "arguments",
});
