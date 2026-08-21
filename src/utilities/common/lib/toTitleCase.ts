import type { ToTitleCaseOptions } from "@types";

const TITLE_CASE_WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]\S*/g;

/**
 * The built-in `discord.js`-flavoured variants {@link toTitleCase} recognizes as-is instead of
 * title-casing each of their words individually.
 *
 * | Term              | Converted to      |
 * |:------------------|:------------------|
 * | textchannel       | TextChannel       |
 * | voicechannel      | VoiceChannel      |
 * | categorychannel   | CategoryChannel   |
 * | guildmember       | GuildMember       |
 *
 * @since 1.0.0
 */
export const toTitleCaseDiscordJsVariants: Record<string, string> = {
	textchannel: "TextChannel",
	voicechannel: "VoiceChannel",
	categorychannel: "CategoryChannel",
	guildmember: "GuildMember",
};

/**
 * Converts a string to Title Case, recognizing common Discord.js class names
 * ({@link toTitleCaseDiscordJsVariants}) and rendering them in their proper casing instead of
 * plain title case.
 *
 * Pass `options.additionalVariants` to merge your own term mappings in alongside the built-in
 * ones.
 *
 * @param text The text to title-case.
 * @param options Extra variants to recognize, and whether matching is case sensitive.
 *
 * @since 1.0.0
 */
export function toTitleCase(
	text: string,
	options: ToTitleCaseOptions = {},
): string {
	const { additionalVariants = {}, caseSensitive } = options;
	const variants = {
		...toTitleCaseDiscordJsVariants,
		...(caseSensitive
			? additionalVariants
			: Object.fromEntries(
					Object.entries(additionalVariants).map(([key, variant]) => [
						key.toLowerCase(),
						variant,
					]),
				)),
	};

	return text.replace(
		TITLE_CASE_WORD,
		(word) =>
			variants[caseSensitive ? word : word.toLowerCase()] ??
			word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
	);
}
