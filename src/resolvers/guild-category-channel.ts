import type { CategoryChannel, Guild } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { isCategoryChannel } from "@utilities/discord.js-utilities/index.ts";
import type { Result } from "@utilities/result/index.ts";
import { resolveGuildChannelPredicate } from "./guild-channel-predicate.ts";

/**
 * Resolves a guild channel and insists it is a category, the container other channels sit under.
 *
 * @param parameter The channel mention, id or name to look up.
 * @param guild The guild whose channels are searched.
 * @returns The category, `guildChannelError` when nothing matched, or `categoryChannelError` when
 * the match was not a category.
 *
 * @since 1.0.0
 */
export function resolveGuildCategoryChannel(
	parameter: string,
	guild: Guild,
): Result<
	CategoryChannel,
	| typeof Identifiers.ArgumentGuildChannelError
	| typeof Identifiers.ArgumentGuildCategoryChannelError
> {
	return resolveGuildChannelPredicate(
		parameter,
		guild,
		isCategoryChannel,
		Identifiers.ArgumentGuildCategoryChannelError,
	);
}
