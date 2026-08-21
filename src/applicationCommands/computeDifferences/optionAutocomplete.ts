import type {
	CommandDifference,
	OptionAutocompleteDifferenceOptions,
} from "@types";
import type { APIApplicationCommandOptionChoice } from "discord.js";
import { checkLocalizations } from "./localizations.ts";

/**
 * Compares the autocomplete flag of an option and, when autocomplete is off on both sides, the
 * preset choices it offers.
 *
 * Discord rejects a command that carries both autocomplete and choices, so the choices are only
 * worth comparing while neither side is autocompleting — otherwise the payload has no choices to
 * disagree about.
 *
 * @param options The options to compare, plus where they sit in the command.
 * @yields One difference for the flag, then one per choice that does not line up.
 *
 * @since 1.0.0
 */
export function* handleAutocomplete({
	currentIndex,
	existingOption,
	expectedOption,
	keyPath,
}: OptionAutocompleteDifferenceOptions): Generator<CommandDifference> {
	// 0. Autocomplete was off and is on now.
	if (!existingOption.autocomplete && expectedOption.autocomplete) {
		yield {
			key: `${keyPath(currentIndex)}.autocomplete`,
			expected: "autocomplete enabled",
			original: "autocomplete disabled",
		};
	}
	// 1. Autocomplete was on and is off now.
	else if (existingOption.autocomplete && !expectedOption.autocomplete) {
		yield {
			key: `${keyPath(currentIndex)}.autocomplete`,
			expected: "autocomplete disabled",
			original: "autocomplete enabled",
		};
	}

	if (!expectedOption.autocomplete && !existingOption.autocomplete) {
		// 0. There were no choices and there are some now.
		if (!existingOption.choices?.length && expectedOption.choices?.length) {
			yield {
				key: `${keyPath(currentIndex)}.choices`,
				expected: "choices present",
				original: "no choices present",
			};
		}
		// 1. There were choices and there are none now.
		else if (
			existingOption.choices?.length &&
			!expectedOption.choices?.length
		) {
			yield {
				key: `${keyPath(currentIndex)}.choices`,
				expected: "no choices present",
				original: "choices present",
			};
		}
		// 2. Both sides have choices, so walk them position by position.
		else if (expectedOption.choices?.length && existingOption.choices?.length) {
			let index = 0;

			for (const choice of expectedOption.choices) {
				const currentChoiceIndex = index++;
				const existingChoice = existingOption.choices[currentChoiceIndex];

				// Nothing was registered at this position before.
				if (existingChoice === undefined) {
					yield {
						key: `${keyPath(currentIndex)}.choices[${currentChoiceIndex}]`,
						original: "no choice present",
						expected: "choice present",
					};
				} else {
					if (choice.name !== existingChoice.name) {
						yield {
							key: `${keyPath(currentIndex)}.choices[${currentChoiceIndex}].name`,
							original: existingChoice.name,
							expected: choice.name,
						};
					}

					yield* checkLocalizations({
						localeMapName: `${keyPath(currentIndex)}.choices[${currentChoiceIndex}].nameLocalizations`,
						localePresentMessage: "localized names",
						localeMissingMessage: "no localized names",
						originalLocalizations: existingChoice.name_localizations,
						expectedLocalizations: choice.name_localizations,
					});

					if (choice.value !== existingChoice.value) {
						yield {
							key: `${keyPath(currentIndex)}.choices[${currentChoiceIndex}].value`,
							original: String(existingChoice.value),
							expected: String(choice.value),
						};
					}
				}
			}

			// Anything left over used to be offered and no longer is.
			if (index < existingOption.choices.length) {
				for (; index < existingOption.choices.length; index++) {
					const choice = existingOption.choices[
						index
					] as APIApplicationCommandOptionChoice;
					yield {
						key: `existing choice at path ${keyPath(currentIndex)}.choices[${index}]`,
						expected: "no choice present",
						original: `choice with name "${choice.name}" and value ${
							typeof choice.value === "number"
								? choice.value
								: `"${choice.value}"`
						} present`,
					};
				}
			}
		}
	}
}
