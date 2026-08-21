import type { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import { PermissionsBitField, type PermissionResolvable } from "discord.js";
import { CommandPreConditions } from "@/constants/enums.ts";

/**
 * Attaches the `UserPermissions` precondition to a command when it declares permissions the person
 * invoking it needs.
 *
 * An empty bitfield means nothing was asked for, so no precondition is added.
 *
 * @param requiredUserPermissions The permissions the caller must hold, as given in the command's
 * options.
 * @param preconditionContainerArray The command's precondition list to append to.
 *
 * @since 1.0.0
 */
export function parseConstructorPreConditionsRequiredUserPermissions(
	requiredUserPermissions: PermissionResolvable | undefined,
	preconditionContainerArray: PreconditionContainerArray,
) {
	const permissions = new PermissionsBitField(requiredUserPermissions);

	if (permissions.bitfield !== 0n) {
		preconditionContainerArray.append({
			name: CommandPreConditions.UserPermissions,
			context: { permissions },
		});
	}
}
