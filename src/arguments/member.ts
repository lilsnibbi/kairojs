import type {
	AsyncArgumentResult,
	MemberArgumentContext,
	PieceLoaderContext,
} from "@types";
import type { GuildMember } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveMember } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a member of the guild the command was invoked in, by mention, id, or — unless the context
 * turns it off — by name.
 *
 * @since 1.0.0
 */
export class CoreMemberArgument extends Argument<GuildMember> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "member" });
	}

	public async run(
		parameter: string,
		context: MemberArgumentContext,
	): AsyncArgumentResult<GuildMember> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentMemberMissingGuild,
				message: "This command can only be used in a server.",
				context,
			});
		}

		const resolved = await resolveMember(
			parameter,
			guild,
			context.performFuzzySearch ?? true,
		);

		return resolved.mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The given argument did not resolve to a server member.",
				context: { ...context, guild },
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "member",
	piece: CoreMemberArgument,
	store: "arguments",
});
