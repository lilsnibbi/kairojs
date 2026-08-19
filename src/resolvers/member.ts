import type { Guild, GuildMember, Snowflake } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import {
	SnowflakeRegex,
	UserOrMemberMentionRegex,
} from "@utilities/discord-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";
import { isNullOrUndefined } from "@utilities/utilities/index.ts";

/**
 * Resolves a member of a guild by mention or id, optionally falling back to a name search.
 *
 * The fallback asks Discord to search the member list, which costs a round trip and can match
 * somebody the caller did not mean, so it is opt-in rather than automatic.
 *
 * @param parameter The member mention, id or name to look up.
 * @param guild The guild whose members are searched.
 * @param performFuzzySearch Whether to fall back to a name search when the parameter is not an id.
 * @returns The member, or `memberError` when nobody matches.
 *
 * @since 1.0.0
 */
export async function resolveMember(
	parameter: string,
	guild: Guild,
	performFuzzySearch?: boolean,
): Promise<Result<GuildMember, typeof Identifiers.ArgumentMemberError>> {
	let member = await findById(parameter, guild);

	if (isNullOrUndefined(member) && performFuzzySearch) {
		member = await findByName(parameter, guild);
	}

	if (member) {
		return ok(member);
	}

	return err(Identifiers.ArgumentMemberError);
}

/**
 * Fetches the member by mention or raw snowflake, treating any failure as "not found".
 */
async function findById(
	parameter: string,
	guild: Guild,
): Promise<GuildMember | null> {
	const match =
		UserOrMemberMentionRegex.exec(parameter) ?? SnowflakeRegex.exec(parameter);
	return match
		? guild.members.fetch(match[1] as Snowflake).catch(() => null)
		: null;
}

/**
 * Asks Discord to search the member list and takes the best match.
 *
 * A trailing legacy discriminator is stripped first, since Discord no longer indexes it and a
 * query that still carries one finds nothing.
 */
async function findByName(
	parameter: string,
	guild: Guild,
): Promise<GuildMember | null> {
	const query =
		parameter.length > 5 && parameter.at(-5) === "#"
			? parameter.slice(0, -5)
			: parameter;

	const members = await guild.members
		.fetch({ query, limit: 1 })
		.catch(() => null);
	return members?.first() ?? null;
}
