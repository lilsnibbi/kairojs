import type {
	ArgumentContext,
	ArgumentResult,
	EmojiObject,
	PieceLoaderContext,
} from "@types";
import { container } from "@/container.ts";
import { resolveEmoji } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses either a standard unicode emoji or a custom guild one. No cache is consulted, so a custom
 * emoji from a guild the bot cannot see still resolves.
 *
 * @since 1.0.0
 */
export class CoreEmojiArgument extends Argument<EmojiObject> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "emoji" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<EmojiObject>,
	): ArgumentResult<EmojiObject> {
		return resolveEmoji(parameter).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The argument did not resolve to an emoji.",
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "emoji",
	piece: CoreEmojiArgument,
	store: "arguments",
});
