import type { CommandDifference, OptionTypeDifferenceOptions } from "@types";
import { describeOptionType } from "./shared.ts";

/**
 * Compares the type of a single option, reporting both sides by their readable names so a log line
 * reads `string option` rather than `3`.
 *
 * @param options The types to compare and the path to report them under.
 * @yields One difference when the types do not match, nothing otherwise.
 *
 * @since 1.0.0
 */
export function* checkOptionType({
	key,
	expectedType,
	originalType,
}: OptionTypeDifferenceOptions): Generator<CommandDifference> {
	const expectedTypeName = describeOptionType(expectedType);

	if (originalType !== expectedType) {
		yield {
			key,
			original: describeOptionType(originalType),
			expected: expectedTypeName,
		};
	}
}
