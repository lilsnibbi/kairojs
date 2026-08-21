import type { CommandDifference } from "@types";

/**
 * Compares whether the command may be used in direct messages.
 *
 * Discord omits the field entirely when it is allowed, so an absent value is read as `true` on both
 * sides before they are compared — otherwise every command that never set it would look changed.
 *
 * @param oldDmPermission The flag Discord currently has.
 * @param newDmPermission The flag the bot defines.
 * @yields One difference when the flags do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkDMPermission(
	oldDmPermission?: boolean,
	newDmPermission?: boolean,
): Generator<CommandDifference> {
	if ((oldDmPermission ?? true) !== (newDmPermission ?? true)) {
		yield {
			key: "dmPermission",
			original: String(oldDmPermission ?? true),
			expected: String(newDmPermission ?? true),
		};
	}
}
