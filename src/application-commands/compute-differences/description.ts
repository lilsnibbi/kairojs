import type { CommandDifference, DescriptionDifferenceOptions } from "@types";

/**
 * Compares the description Discord has against the description the bot defines.
 *
 * @param options The descriptions to compare and the path to report them under.
 * @yields One difference when the descriptions do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkDescription({
	oldDescription,
	newDescription,
	key = "description",
}: DescriptionDifferenceOptions): Generator<CommandDifference> {
	if (oldDescription !== newDescription) {
		yield {
			key,
			original: oldDescription,
			expected: newDescription,
		};
	}
}
