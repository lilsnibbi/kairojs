import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { container } from "@/container.ts";
import { resolveHyperlink } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses an absolute URL. It is also reachable under the shorter alias `url`.
 *
 * @since 1.0.0
 */
export class CoreHyperlinkArgument extends Argument<URL> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "hyperlink", aliases: ["url"] });
	}

	public run(
		parameter: string,
		context: ArgumentContext<URL>,
	): ArgumentResult<URL> {
		return resolveHyperlink(parameter).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The argument did not resolve to a valid URL.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "hyperlink",
	piece: CoreHyperlinkArgument,
	store: "arguments",
});
