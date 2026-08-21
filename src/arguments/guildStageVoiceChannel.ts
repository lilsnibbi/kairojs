import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { StageChannel } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveGuildStageVoiceChannel } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a stage channel of the guild the command was invoked in.
 *
 * There is nothing to search outside a guild, so an invocation from a DM is refused up front rather
 * than reported as a channel that could not be found.
 *
 * @since 1.0.0
 */
export class CoreGuildStageVoiceChannelArgument extends Argument<StageChannel> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "guildStageVoiceChannel" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<StageChannel>,
	): ArgumentResult<StageChannel> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentGuildChannelMissingGuildError,
				message: "This command can only be used in a server.",
				context,
			});
		}

		return resolveGuildStageVoiceChannel(parameter, guild).mapErrInto(
			(identifier) =>
				this.error({
					parameter,
					identifier,
					message:
						"The given argument did not resolve to a valid stage voice channel.",
					context: { ...context, guild },
				}),
		);
	}
}

void container.stores.loadPiece({
	name: "guildStageVoiceChannel",
	piece: CoreGuildStageVoiceChannelArgument,
	store: "arguments",
});
