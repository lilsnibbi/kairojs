import type {
	CommandDifference,
	OptionMinMaxValueDifferenceOptions,
} from "@types";

/**
 * Compares the numeric bounds of an integer or number option.
 *
 * A bound being added or removed is reported differently from a bound simply moving, because
 * "no longer capped" is a far more consequential change than "capped at a different number".
 *
 * @param options The options to compare, plus where they sit in the command.
 * @yields Up to one difference for `min_value` and one for `max_value`.
 *
 * @since 1.0.0
 */
export function* handleMinMaxValueOptions({
	currentIndex,
	existingOption,
	expectedOption,
	keyPath,
}: OptionMinMaxValueDifferenceOptions): Generator<CommandDifference> {
	// 0. There was no lower bound and there is one now.
	if (
		existingOption.min_value === undefined &&
		expectedOption.min_value !== undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.min_value`,
			expected: "min_value present",
			original: "no min_value present",
		};
	}
	// 1. There was a lower bound and there is none now.
	else if (
		existingOption.min_value !== undefined &&
		expectedOption.min_value === undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.min_value`,
			expected: "no min_value present",
			original: "min_value present",
		};
	}
	// 2. Both sides have a lower bound, so compare them.
	else if (existingOption.min_value !== expectedOption.min_value) {
		yield {
			key: `${keyPath(currentIndex)}.min_value`,
			original: String(existingOption.min_value),
			expected: String(expectedOption.min_value),
		};
	}

	// 0. There was no upper bound and there is one now.
	if (
		existingOption.max_value === undefined &&
		expectedOption.max_value !== undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.max_value`,
			expected: "max_value present",
			original: "no max_value present",
		};
	}
	// 1. There was an upper bound and there is none now.
	else if (
		existingOption.max_value !== undefined &&
		expectedOption.max_value === undefined
	) {
		yield {
			key: `${keyPath(currentIndex)}.max_value`,
			expected: "no max_value present",
			original: "max_value present",
		};
	}
	// 2. Both sides have an upper bound, so compare them.
	else if (existingOption.max_value !== expectedOption.max_value) {
		yield {
			key: `${keyPath(currentIndex)}.max_value`,
			original: String(existingOption.max_value),
			expected: String(expectedOption.max_value),
		};
	}
}
