import type { Guild, Role, Snowflake } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import {
	RoleMentionRegex,
	SnowflakeRegex,
} from "@utilities/discord-utilities/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves a role by mention, id or exact name.
 *
 * Identifiers are tried first and may hit the API; the name search that follows only looks at the
 * cache and is case-insensitive but not fuzzy.
 *
 * @param parameter The role mention, id or name to look up.
 * @param guild The guild whose roles are searched.
 * @returns The role, or `roleError` when nothing matches.
 *
 * @since 1.0.0
 */
export async function resolveRole(
	parameter: string,
	guild: Guild,
): Promise<Result<Role, typeof Identifiers.ArgumentRoleError>> {
	const role =
		(await findById(parameter, guild)) ?? findByName(parameter, guild);

	if (role) {
		return ok(role);
	}

	return err(Identifiers.ArgumentRoleError);
}

/**
 * Fetches the role by mention or raw snowflake.
 */
async function findById(parameter: string, guild: Guild): Promise<Role | null> {
	const match =
		RoleMentionRegex.exec(parameter) ?? SnowflakeRegex.exec(parameter);
	return match ? guild.roles.fetch(match[1] as Snowflake) : null;
}

/**
 * Looks the role up by an exact, case-insensitive name match against the cache.
 */
function findByName(parameter: string, guild: Guild): Role | null {
	const normalized = parameter.toLowerCase();
	return (
		guild.roles.cache.find((role) => role.name.toLowerCase() === normalized) ??
		null
	);
}
