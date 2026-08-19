import type {
	CommandDifference,
	OptionMinMaxLengthDifferenceOptions,
} from "@types";

/**
 * Compares the length bounds of a string option.
 *
 * A bound being added or removed is reported differently from a bound simply moving, because
 * "no longer limited" is a far more consequential change than "limited to a different length".
 *
 * @param options The options to compare, plus where they sit in the command.
 * @yields Up to one difference for `min_length` and one for `max_length`.
 *
 * @since 1.0.0
 */
export function* handleMinMaxLengthOptions({
	currentIndex,
	existingOption,
	expectedOption,
	keyPath,
}: OptionMinMaxLengthDifferenceOptions): Generator<CommandDifference> {
	// 0. There was no lower bound and there is one now.
	if (
		existingOption.min_length === undefined &&
		expectedOption.min_length !== undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.min_length`,
			expected: "min_length present",
			original: "no min_length present",
		};
	}
	// 1. There was a lower bound and there is none now.
	else if (
		existingOption.min_length !== undefined &&
		expectedOption.min_length === undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.min_length`,
			expected: "no min_length present",
			original: "min_length present",
		};
	}
	// 2. Both sides have a lower bound, so compare them.
	else if (existingOption.min_length !== expectedOption.min_length) {
		yield {
			key: `${keyPath(currentIndex)}.min_length`,
			original: String(existingOption.min_length),
			expected: String(expectedOption.min_length),
		};
	}

	// 0. There was no upper bound and there is one now.
	if (
		existingOption.max_length === undefined &&
		expectedOption.max_length !== undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.max_length`,
			expected: "max_length present",
			original: "no max_length present",
		};
	}
	// 1. There was an upper bound and there is none now.
	else if (
		existingOption.max_length !== undefined &&
		expectedOption.max_length === undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.max_length`,
			expected: "no max_length present",
			original: "max_length present",
		};
	}
	// 2. Both sides have an upper bound, so compare them.
	else if (existingOption.max_length !== expectedOption.max_length) {
		yield {
			key: `${keyPath(currentIndex)}.max_length`,
			original: String(existingOption.max_length),
			expected: String(expectedOption.max_length),
		};
	}
}
