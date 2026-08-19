import type {
	ArgumentContext,
	AsyncArgumentResult,
	PieceLoaderContext,
} from "@types";
import type { Role } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveRole } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses a role of the guild the command was invoked in, by mention, id or exact name.
 *
 * @since 1.0.0
 */
export class CoreRoleArgument extends Argument<Role> {
	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "role" });
	}

	public async run(
		parameter: string,
		context: ArgumentContext<Role>,
	): AsyncArgumentResult<Role> {
		const { guild } = context.message;

		if (!guild) {
			return this.error({
				parameter,
				identifier: Identifiers.ArgumentRoleMissingGuild,
				message: "This command can only be used in a server.",
				context,
			});
		}

		const resolved = await resolveRole(parameter, guild);

		return resolved.mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: "The given argument did not resolve to a role.",
				context: { ...context, guild },
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "role",
	piece: CoreRoleArgument,
	store: "arguments",
});
