import type {
	APIApplicationCommandChoosableAndAutocompletableTypes,
	APIApplicationCommandMinAndMaxValueTypes,
	APIApplicationCommandMinMaxLengthTypes,
	APIApplicationCommandSubcommandTypes,
	CommandDifference,
	ReportOptionDifferencesOptions,
	SubcommandOptionsDifferenceOptions,
} from "@types";
import {
	ApplicationCommandOptionType,
	type APIApplicationCommandChannelOption,
	type APIApplicationCommandOption,
} from "discord.js";
import { checkDescription } from "./description.ts";
import { checkLocalizations } from "./localizations.ts";
import { checkName } from "./name.ts";
import { handleAutocomplete } from "./option-autocomplete.ts";
import { checkChannelTypes } from "./option-channel-types.ts";
import { handleMinMaxLengthOptions } from "./option-min-max-length.ts";
import { handleMinMaxValueOptions } from "./option-min-max-value.ts";
import { checkOptionRequired } from "./option-required.ts";
import { checkOptionType } from "./option-type.ts";
import {
	describeOptionType,
	hasChannelTypesSupport,
	hasChoicesAndAutocompleteSupport,
	hasMinMaxLengthSupport,
	hasMinMaxValueSupport,
	subcommandTypes,
} from "./shared.ts";

/**
 * Compares the option list Discord has against the one the bot defines.
 *
 * Options are positional: Discord keeps them in the order they were sent and the order decides what
 * a user types, so the two lists are walked in lockstep by index rather than matched up by name.
 *
 * @param existingOptions The options Discord currently has.
 * @param newOptions The options the bot defines.
 * @yields One difference per option that does not line up, recursing into subcommands.
 *
 * @since 1.0.0
 */
export function* checkOptions(
	existingOptions?: APIApplicationCommandOption[],
	newOptions?: APIApplicationCommandOption[],
): Generator<CommandDifference> {
	// 0. There were no options and there are some now.
	if (!existingOptions?.length && newOptions?.length) {
		yield {
			key: "options",
			original: "no options present",
			expected: "options present",
		};
	}
	// 1. There were options and there are none now.
	else if (existingOptions?.length && !newOptions?.length) {
		yield {
			key: "options",
			original: "options present",
			expected: "no options present",
		};
	}
	// 2. Both sides have options, so walk them position by position.
	else if (newOptions?.length) {
		let index = 0;

		for (const option of newOptions) {
			const currentIndex = index++;
			const existingOption = existingOptions![currentIndex];
			yield* reportOptionDifferences({ currentIndex, option, existingOption });
		}

		// Anything left over used to be registered and no longer is.
		if (existingOptions && index < existingOptions.length) {
			for (; index < existingOptions.length; index++) {
				const option = existingOptions[index] as APIApplicationCommandOption;
				yield {
					key: `existing command option at index ${index}`,
					expected: "no option present",
					original: `${describeOptionType(option.type)} with name ${option.name}`,
				};
			}
		}
	}
}

/**
 * Compares one option against the one Discord has at the same position, checking every facet the
 * option's type supports and recursing into subcommands and subcommand groups.
 *
 * The path an option is reported under is threaded through as a function so a nested option can
 * extend its parent's path instead of every checker having to know how deep it sits.
 *
 * @param options The option to compare, its counterpart, and where it sits in the command.
 */
function* reportOptionDifferences({
	option,
	existingOption,
	currentIndex,
	keyPath = (index: number) => `options[${index}]`,
}: ReportOptionDifferencesOptions): Generator<CommandDifference> {
	// Nothing was registered at this position, so there is nothing left to compare.
	if (!existingOption) {
		yield {
			key: keyPath(currentIndex),
			expected: `${describeOptionType(option.type)} with name ${option.name}`,
			original: "no option present",
		};

		return;
	}

	yield* checkOptionType({
		key: `${keyPath(currentIndex)}.type`,
		originalType: existingOption.type,
		expectedType: option.type,
	});

	yield* checkName({
		key: `${keyPath(currentIndex)}.name`,
		oldName: existingOption.name,
		newName: option.name,
	});

	yield* checkLocalizations({
		localeMapName: `${keyPath(currentIndex)}.nameLocalizations`,
		localePresentMessage: "localized names",
		localeMissingMessage: "no localized names",
		originalLocalizations: existingOption.name_localizations,
		expectedLocalizations: option.name_localizations,
	});

	yield* checkDescription({
		key: `${keyPath(currentIndex)}.description`,
		oldDescription: existingOption.description,
		newDescription: option.description,
	});

	yield* checkLocalizations({
		localeMapName: `${keyPath(currentIndex)}.descriptionLocalizations`,
		localePresentMessage: "localized descriptions",
		localeMissingMessage: "no localized descriptions",
		originalLocalizations: existingOption.description_localizations,
		expectedLocalizations: option.description_localizations,
	});

	yield* checkOptionRequired({
		key: `${keyPath(currentIndex)}.required`,
		oldRequired: existingOption.required,
		newRequired: option.required,
	});

	// Subcommands and subcommand groups nest further options, so recurse into them.
	if (
		subcommandTypes.includes(existingOption.type) &&
		subcommandTypes.includes(option.type)
	) {
		const castedExisting =
			existingOption as APIApplicationCommandSubcommandTypes;
		const castedExpected = option as APIApplicationCommandSubcommandTypes;

		if (
			castedExisting.type === ApplicationCommandOptionType.SubcommandGroup &&
			castedExpected.type === ApplicationCommandOptionType.SubcommandGroup
		) {
			// Both sides are groups, so both are guaranteed to hold subcommands.
			for (const [
				subcommandIndex,
				subcommandOption,
			] of castedExpected.options!.entries()) {
				yield* reportOptionDifferences({
					currentIndex: subcommandIndex,
					option: subcommandOption,
					existingOption: castedExisting.options?.[subcommandIndex],
					keyPath: (index) => `${keyPath(currentIndex)}.options[${index}]`,
				});
			}
		} else if (
			castedExisting.type === ApplicationCommandOptionType.Subcommand &&
			castedExpected.type === ApplicationCommandOptionType.Subcommand
		) {
			yield* handleSubcommandOptions({
				expectedOptions: castedExpected.options,
				existingOptions: castedExisting.options,
				currentIndex,
				keyPath,
			});
		}
	}

	if (hasMinMaxValueSupport(option)) {
		yield* handleMinMaxValueOptions({
			currentIndex,
			existingOption:
				existingOption as APIApplicationCommandMinAndMaxValueTypes,
			expectedOption: option,
			keyPath,
		});
	}

	if (hasChoicesAndAutocompleteSupport(option)) {
		yield* handleAutocomplete({
			currentIndex,
			existingOption:
				existingOption as APIApplicationCommandChoosableAndAutocompletableTypes,
			expectedOption: option,
			keyPath,
		});
	}

	if (hasMinMaxLengthSupport(option)) {
		yield* handleMinMaxLengthOptions({
			currentIndex,
			existingOption: existingOption as APIApplicationCommandMinMaxLengthTypes,
			expectedOption: option,
			keyPath,
		});
	}

	if (hasChannelTypesSupport(option)) {
		yield* checkChannelTypes({
			currentIndex,
			existingChannelTypes: (
				existingOption as APIApplicationCommandChannelOption
			).channel_types,
			keyPath,
			newChannelTypes: option.channel_types,
		});
	}
}

/**
 * Compares the options nested inside a subcommand, which — unlike a subcommand group — holds plain
 * value options rather than further subcommands.
 *
 * @param options The nested option lists to compare, plus where the subcommand sits.
 */
function* handleSubcommandOptions({
	expectedOptions,
	existingOptions,
	currentIndex,
	keyPath,
}: SubcommandOptionsDifferenceOptions): Generator<CommandDifference> {
	// 0. There were no nested options and there are some now.
	if (!existingOptions?.length && expectedOptions?.length) {
		yield {
			key: `${keyPath(currentIndex)}.options`,
			expected: "options present",
			original: "no options present",
		};
	}
	// 1. There were nested options and there are none now.
	else if (existingOptions?.length && !expectedOptions?.length) {
		yield {
			key: `${keyPath(currentIndex)}.options`,
			expected: "no options present",
			original: "options present",
		};
	}
	// 2. Both sides have nested options, so walk them position by position.
	else if (expectedOptions?.length) {
		let processedIndex = 0;

		for (const subcommandOption of expectedOptions) {
			const currentSubcommandOptionIndex = processedIndex++;

			yield* reportOptionDifferences({
				currentIndex: currentSubcommandOptionIndex,
				option: subcommandOption,
				existingOption: existingOptions![currentSubcommandOptionIndex],
				keyPath: (index) => `${keyPath(currentIndex)}.options[${index}]`,
			});
		}

		// Anything left over used to be registered and no longer is.
		if (existingOptions && processedIndex < existingOptions.length) {
			for (; processedIndex < existingOptions.length; processedIndex++) {
				const option = existingOptions[
					processedIndex
				] as APIApplicationCommandOption;
				yield {
					key: `existing command option at path ${keyPath(currentIndex)}.options[${processedIndex}]`,
					expected: "no option present",
					original: `${describeOptionType(option.type)} with name ${option.name}`,
				};
			}
		}
	}
}
