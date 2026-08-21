import type { CommandDifference, NameDifferenceOptions } from "@types";

/**
 * Compares the name Discord has against the name the bot defines.
 *
 * @param options The names to compare and the path to report them under.
 * @yields One difference when the names do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkName({
	oldName,
	newName,
	key = "name",
}: NameDifferenceOptions): Generator<CommandDifference> {
	if (oldName !== newName) {
		yield {
			key,
			original: oldName,
			expected: newName,
		};
	}
}
