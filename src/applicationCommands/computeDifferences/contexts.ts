import type { CommandDifference } from "@types";
import type { InteractionContextType } from "discord.js";

/**
 * Compares where the command may be invoked from — a guild, a direct message with the bot, or any
 * other private channel.
 *
 * Discord treats the list as ordered, so a reordering counts as a change and is reported entry by
 * entry rather than as a single wholesale mismatch.
 *
 * @param existingContexts The list Discord currently has.
 * @param newContexts The list the bot defines.
 * @yields One difference per position that does not line up.
 *
 * @since 1.0.0
 */
export function* checkInteractionContextTypes(
	existingContexts?: InteractionContextType[],
	newContexts?: InteractionContextType[],
): Generator<CommandDifference> {
	// 0. Nothing was registered before and there is something now.
	if (!existingContexts && newContexts?.length) {
		yield {
			key: "contexts",
			original: "no contexts present",
			expected: "contexts present",
		};
	}
	// 1. Something was registered before and there is nothing now.
	else if (existingContexts?.length && !newContexts?.length) {
		yield {
			key: "contexts",
			original: "contexts present",
			expected: "no contexts present",
		};
	}
	// 2. Both sides have entries, so walk them position by position.
	else if (newContexts?.length) {
		let index = 0;

		for (const newContext of newContexts) {
			const currentIndex = index++;

			if (existingContexts![currentIndex] !== newContext) {
				yield {
					key: `contexts[${currentIndex}]`,
					original: `contexts type ${existingContexts?.[currentIndex]}`,
					expected: `contexts type ${newContext}`,
				};
			}
		}

		// Anything left over used to be registered and no longer is.
		if (existingContexts && index < existingContexts.length) {
			for (; index < existingContexts.length; index++) {
				const type = existingContexts[index] as InteractionContextType;
				yield {
					key: `contexts[${index}]`,
					original: `context ${type} present`,
					expected: "no context present",
				};
			}
		}
	}
}
