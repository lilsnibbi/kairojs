import type { EmojiObject, Identifier } from "@types";
import { parseEmoji } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import {
	EmojiRegex,
	createTwemojiRegex,
} from "@utilities/discord-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * A private matcher for standard unicode emoji. It is global, so its `lastIndex` has to be cleared
 * after every use.
 */
const twemojiMatcher = createTwemojiRegex();

/**
 * Reads a parameter as either a standard unicode emoji or a custom guild emoji.
 *
 * A unicode emoji comes back with its literal characters as the name and no id; a custom emoji is
 * broken apart into its name, snowflake and animated flag. No cache is consulted either way, so a
 * custom emoji from a guild the bot cannot see still resolves.
 *
 * @param parameter The raw text to interpret.
 * @returns The emoji, or `emojiError` when the text is neither form.
 *
 * @since 1.0.0
 */
export function resolveEmoji(
	parameter: string,
): Result<EmojiObject, Identifier> {
	const twemoji = twemojiMatcher.exec(parameter)?.[0] ?? null;

	twemojiMatcher.lastIndex = 0;

	if (twemoji) {
		return ok<EmojiObject>({
			name: twemoji,
			id: null,
		});
	}

	if (EmojiRegex.test(parameter)) {
		const parsed = parseEmoji(parameter) as EmojiObject | null;

		if (parsed) {
			return ok(parsed);
		}
	}

	return err(Identifiers.ArgumentEmojiError);
}
