import type { CommandDifference } from "@types";

/**
 * Compares the permission bitfield a member needs before the command is even shown to them.
 *
 * The value travels as a string because the bitfield does not fit in a JavaScript number, so the
 * comparison is a plain string comparison and `null` — meaning "no restriction" — is reported as
 * the literal text `null`.
 *
 * @param oldPermissions The bitfield Discord currently has.
 * @param newPermissions The bitfield the bot defines.
 * @yields One difference when the bitfields do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkDefaultMemberPermissions(
	oldPermissions?: string | null,
	newPermissions?: string | null,
): Generator<CommandDifference> {
	if (oldPermissions !== newPermissions) {
		yield {
			key: "defaultMemberPermissions",
			original: String(oldPermissions),
			expected: String(newPermissions),
		};
	}
}
