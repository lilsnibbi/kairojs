import type { Args } from "@/parsers/args.ts";
import type {
	ParseSubcommandConstructorPreConditionsCooldownParameters,
	SubcommandOptions,
} from "@types";
import { BucketScope } from "@/constants/enums.ts";
import { SubcommandCommandPreConditions } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";

/**
 * Attaches the subcommand cooldown precondition to one subcommand mapping, folding the client-wide
 * subcommand defaults together with whatever that mapping declared for itself.
 *
 * This mirrors the command-level cooldown resolver, but reads `subcommandDefaultCooldown` rather
 * than `defaultCooldown` and keys its filter list by the full path to the subcommand — `config.show`
 * at the top level, `config.set.prefix` inside a group — so one subcommand can be exempted without
 * exempting its siblings. As with commands, the precondition is only appended when both the limit
 * and the delay end up non-zero.
 *
 * @param options Which subcommand to parse cooldowns for, and the values it declared.
 *
 * @since 1.0.0
 */
export function parseSubcommandConstructorPreConditionsCooldown<
	PreParseReturn extends Args = Args,
	Options extends SubcommandOptions = SubcommandOptions,
>({
	subcommand: command,
	cooldownLimit,
	cooldownDelay,
	cooldownScope,
	cooldownFilteredUsers,
	subcommandMethodName,
	subcommandGroupName,
	preconditionContainerArray,
}: ParseSubcommandConstructorPreConditionsCooldownParameters<
	PreParseReturn,
	Options
>) {
	const { subcommandDefaultCooldown } = container.client.options;

	// A filtered subcommand falls back to 0, which keeps the precondition off, but an explicitly
	// supplied value still overrides that. Unfiltered ones fall back to the client default, and
	// finally to a single use with no delay.
	const qualifiedName = subcommandGroupName
		? `${command.name}.${subcommandGroupName}.${subcommandMethodName}`
		: `${command.name}.${subcommandMethodName}`;

	const filtered =
		subcommandDefaultCooldown?.filteredCommands?.includes(qualifiedName) ??
		false;
	const limit =
		cooldownLimit ?? (filtered ? 0 : (subcommandDefaultCooldown?.limit ?? 1));
	const delay =
		cooldownDelay ?? (filtered ? 0 : (subcommandDefaultCooldown?.delay ?? 0));

	if (limit && delay) {
		const scope =
			cooldownScope ?? subcommandDefaultCooldown?.scope ?? BucketScope.User;
		const filteredUsers =
			cooldownFilteredUsers ?? subcommandDefaultCooldown?.filteredUsers;

		preconditionContainerArray.append({
			name: SubcommandCommandPreConditions.PluginSubcommandCooldown,
			context: {
				scope,
				limit,
				delay,
				filteredUsers,
				subcommandGroupName,
				subcommandMethodName,
			},
		});
	}
}
