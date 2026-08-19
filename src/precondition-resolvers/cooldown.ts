import type { BucketScope, CommandOptions } from "@types";
import type { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";
import {
	BucketScope as BucketScopes,
	CommandPreConditions,
} from "@/constants/enums.ts";
import { container } from "@/container.ts";
import type { Command } from "@/structures/command.ts";

/**
 * Attaches the `Cooldown` precondition to a command, folding the client-wide defaults together
 * with whatever the command declared for itself.
 *
 * A command named in the client's `filteredCommands` list opts out of the defaults, but it can
 * still set its own limit and delay: an explicit value always wins over both the filter and the
 * default. Only when both the limit and the delay end up non-zero is the precondition added, so
 * commands with no cooldown do no work at dispatch time.
 *
 * @param command The command the cooldown belongs to, consulted for its name.
 * @param cooldownLimit How many uses are allowed inside one window.
 * @param cooldownDelay How long that window lasts, in milliseconds.
 * @param cooldownScope Who the bucket is shared between.
 * @param cooldownFilteredUsers Ids exempt from the cooldown entirely.
 * @param preconditionContainerArray The command's precondition list to append to.
 *
 * @since 1.0.0
 */
export function parseConstructorPreConditionsCooldown<
	PreParseReturn,
	Options extends CommandOptions,
>(
	command: Command<PreParseReturn, Options>,
	cooldownLimit: number | undefined,
	cooldownDelay: number | undefined,
	cooldownScope: BucketScope | undefined,
	cooldownFilteredUsers: string[] | undefined,
	preconditionContainerArray: PreconditionContainerArray,
) {
	const { defaultCooldown } = container.client.options;

	// A filtered command falls back to 0, which keeps the precondition off, but an explicitly
	// supplied value still overrides that. Unfiltered commands fall back to the client default,
	// and finally to a single use with no delay.
	const filtered =
		defaultCooldown?.filteredCommands?.includes(command.name) ?? false;
	const limit = cooldownLimit ?? (filtered ? 0 : (defaultCooldown?.limit ?? 1));
	const delay = cooldownDelay ?? (filtered ? 0 : (defaultCooldown?.delay ?? 0));

	if (limit && delay) {
		const scope = cooldownScope ?? defaultCooldown?.scope ?? BucketScopes.User;
		const filteredUsers =
			cooldownFilteredUsers ?? defaultCooldown?.filteredUsers;

		preconditionContainerArray.append({
			name: CommandPreConditions.Cooldown,
			context: { scope, limit, delay, filteredUsers },
		});
	}
}
