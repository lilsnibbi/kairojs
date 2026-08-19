import type { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";
import { PermissionsBitField, type PermissionResolvable } from "discord.js";
import { CommandPreConditions } from "@/constants/enums.ts";

/**
 * Attaches the `ClientPermissions` precondition to a command when it declares permissions the bot
 * itself needs.
 *
 * An empty bitfield means nothing was asked for, so no precondition is added and the command pays
 * no cost for the feature it does not use.
 *
 * @param requiredClientPermissions The permissions the bot must hold, as given in the command's
 * options.
 * @param preconditionContainerArray The command's precondition list to append to.
 *
 * @since 1.0.0
 */
export function parseConstructorPreConditionsRequiredClientPermissions(
	requiredClientPermissions: PermissionResolvable | undefined,
	preconditionContainerArray: PreconditionContainerArray,
) {
	const permissions = new PermissionsBitField(requiredClientPermissions);

	if (permissions.bitfield !== 0n) {
		preconditionContainerArray.append({
			name: CommandPreConditions.ClientPermissions,
			context: { permissions },
		});
	}
}
