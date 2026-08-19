import type { CommandDifference } from "@types";
import type { ApplicationIntegrationType } from "discord.js";

/**
 * Compares where the command may be installed — to a guild, to a user, or both.
 *
 * Discord treats the list as ordered, so a reordering counts as a change and is reported entry by
 * entry rather than as a single wholesale mismatch.
 *
 * @param existingIntegrationTypes The list Discord currently has.
 * @param newIntegrationTypes The list the bot defines.
 * @yields One difference per position that does not line up.
 *
 * @since 1.0.0
 */
export function* checkIntegrationTypes(
	existingIntegrationTypes?: ApplicationIntegrationType[],
	newIntegrationTypes?: ApplicationIntegrationType[],
): Generator<CommandDifference> {
	// 0. Nothing was registered before and there is something now.
	if (!existingIntegrationTypes?.length && newIntegrationTypes?.length) {
		yield {
			key: "integrationTypes",
			original: "no integration types present",
			expected: "integration types present",
		};
	}
	// 1. Something was registered before and there is nothing now.
	else if (existingIntegrationTypes?.length && !newIntegrationTypes?.length) {
		yield {
			key: "integrationTypes",
			original: "integration types present",
			expected: "no integration types present",
		};
	}
	// 2. Both sides have entries, so walk them position by position.
	else if (newIntegrationTypes?.length) {
		let index = 0;

		for (const newIntegrationType of newIntegrationTypes) {
			const currentIndex = index++;

			if (existingIntegrationTypes![currentIndex] !== newIntegrationType) {
				yield {
					key: `integrationTypes[${currentIndex}]`,
					original: `integration type ${existingIntegrationTypes?.[currentIndex]}`,
					expected: `integration type ${newIntegrationType}`,
				};
			}
		}

		// Anything left over used to be registered and no longer is.
		if (existingIntegrationTypes && index < existingIntegrationTypes.length) {
			for (; index < existingIntegrationTypes.length; index++) {
				const type = existingIntegrationTypes[
					index
				] as ApplicationIntegrationType;
				yield {
					key: `integrationTypes[${index}]`,
					original: `integration type ${type} present`,
					expected: "no integration type present",
				};
			}
		}
	}
}
