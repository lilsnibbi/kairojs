import type { CommandDifference, LocalizationDifferenceOptions } from "@types";
import type { LocalizationMap } from "discord.js";

/**
 * Compares two localization maps — the translations Discord has against the ones the bot defines.
 *
 * Names and descriptions are both localized the same way, so this checker is told how to describe
 * the map it was handed instead of assuming one or the other.
 *
 * @param options The maps to compare, plus the wording to describe them with.
 * @yields One difference per locale that was added, removed or retranslated.
 *
 * @since 1.0.0
 */
export function* checkLocalizations({
	localeMapName,
	localePresentMessage,
	localeMissingMessage,
	originalLocalizations,
	expectedLocalizations,
}: LocalizationDifferenceOptions): Generator<CommandDifference> {
	if (!originalLocalizations && expectedLocalizations) {
		yield {
			key: localeMapName,
			original: localeMissingMessage,
			expected: localePresentMessage,
		};
	} else if (originalLocalizations && !expectedLocalizations) {
		yield {
			key: localeMapName,
			original: localePresentMessage,
			expected: localeMissingMessage,
		};
	} else if (originalLocalizations && expectedLocalizations) {
		yield* reportLocalizationMapDifferences(
			originalLocalizations,
			expectedLocalizations,
			localeMapName,
		);
	}
}

/**
 * Walks two localization maps that both have entries and reports every locale they disagree on.
 *
 * Locales are consumed from a copy of the original map as they are visited, so whatever remains at
 * the end is exactly the set of translations that were dropped.
 *
 * @param originalMap The map Discord currently has.
 * @param expectedMap The map the bot defines.
 * @param mapName The path the map lives at.
 */
function* reportLocalizationMapDifferences(
	originalMap: LocalizationMap,
	expectedMap: LocalizationMap,
	mapName: string,
): Generator<CommandDifference> {
	const remainingOriginals = new Map(Object.entries(originalMap));

	for (const [locale, translation] of Object.entries(expectedMap)) {
		const previousTranslation = remainingOriginals.get(locale) as
			| string
			| undefined;
		remainingOriginals.delete(locale);

		const wasMissingBefore = typeof previousTranslation === "undefined";
		const isResetNow = translation === null;

		// Absent before, present now.
		if (wasMissingBefore && !isResetNow) {
			yield {
				key: `${mapName}.${locale}`,
				original: "no localization present",
				expected: translation,
			};
		}
		// Present before, explicitly cleared now.
		else if (!wasMissingBefore && isResetNow) {
			yield {
				key: `${mapName}.${locale}`,
				original: previousTranslation,
				expected: "no localization present",
			};
		}
		// Present on both sides, but retranslated.
		else if (previousTranslation !== translation) {
			yield {
				key: `${mapName}.${locale}`,
				original: String(previousTranslation),
				expected: String(translation),
			};
		}
	}

	// Whatever was never visited above is a translation that has been dropped.
	for (const [locale, translation] of remainingOriginals) {
		if (translation) {
			yield {
				key: `${mapName}.${locale}`,
				original: translation,
				expected: "no localization present",
			};
		}
	}
}
