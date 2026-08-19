/**
 * The identifiers attached to the errors the permission decorators raise.
 *
 * They are stable keys rather than prose, which is what makes it practical to translate the message
 * shown to a user, or to branch on the exact reason a method refused to run.
 *
 * @since 1.0.0
 */
export const DecoratorIdentifiers = Object.freeze({
	/**
	 * The client cannot hold the requested permissions in a DM, so the method is guild-only.
	 */
	RequiresClientPermissionsGuildOnly: "requiresClientPermissionsGuildOnly",

	/**
	 * The client is missing at least one of the requested permissions in the current channel.
	 */
	RequiresClientPermissionsMissingPermissions:
		"requiresClientPermissionsMissingPermissions",

	/**
	 * The user cannot hold the requested permissions in a DM, so the method is guild-only.
	 */
	RequiresUserPermissionsGuildOnly: "requiresUserPermissionsGuildOnly",

	/**
	 * The user is missing at least one of the requested permissions in the current channel.
	 */
	RequiresUserPermissionsMissingPermissions:
		"requiresUserPermissionsMissingPermissions",
} as const);
