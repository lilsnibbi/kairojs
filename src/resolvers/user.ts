import type { Snowflake, User } from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import {
	SnowflakeRegex,
	UserOrMemberMentionRegex,
} from "@utilities/discord/index.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Resolves a user by mention or id, fetching them from the API when they are not cached.
 *
 * The lookup is global rather than scoped to a guild, so it finds anybody the bot shares no server
 * with. Usernames are not accepted, since they are not unique.
 *
 * @param parameter The user mention or id to look up.
 * @returns The user, or `userError` when the text is not an id or no such user exists.
 *
 * @since 1.0.0
 */
export async function resolveUser(
	parameter: string,
): Promise<Result<User, typeof Identifiers.ArgumentUserError>> {
	const match =
		UserOrMemberMentionRegex.exec(parameter) ?? SnowflakeRegex.exec(parameter);
	const user = match
		? await container.client.users
				.fetch(match[1] as Snowflake)
				.catch(() => null)
		: null;

	if (user) {
		return ok(user);
	}

	return err(Identifiers.ArgumentUserError);
}
