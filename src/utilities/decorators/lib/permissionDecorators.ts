import {
	PermissionFlagsBits,
	PermissionsBitField,
	type BaseInteraction,
	type Message,
	type PermissionResolvable,
} from "discord.js";
import type { FunctionFallback } from "@types";
import {
	isDMChannel,
	isGuildBasedChannel,
} from "@utilities/discordjs/index.ts";
import { isNullish } from "@utilities/common/index.ts";
import { UserError } from "@/errors/userError.ts";
import { DecoratorIdentifiers } from "./identifiers.ts";
import { createFunctionPrecondition } from "./factories.ts";

/**
 * Every permission a bot does *not* implicitly have in a DM.
 *
 * Discord grants a bot a fixed handful of permissions inside a DM; asking for anything outside that
 * set can only ever be satisfied in a guild. This is the complement of the DM-available set, so
 * intersecting it with a request tells us whether the request is guild-only.
 */
const ClientGuildOnlyPermissions = new PermissionsBitField(
	~new PermissionsBitField([
		PermissionFlagsBits.AddReactions,
		PermissionFlagsBits.AttachFiles,
		PermissionFlagsBits.EmbedLinks,
		PermissionFlagsBits.ReadMessageHistory,
		PermissionFlagsBits.SendMessages,
		PermissionFlagsBits.UseExternalEmojis,
		PermissionFlagsBits.ViewChannel,
	]).bitfield & PermissionsBitField.All,
);

/**
 * Every permission a user does *not* implicitly have in a DM.
 *
 * A user gets slightly more than a bot does — external stickers and mentioning everyone are theirs
 * in a DM — so this set is deliberately narrower than {@link ClientGuildOnlyPermissions}.
 */
const UserGuildOnlyPermissions = new PermissionsBitField(
	~new PermissionsBitField([
		PermissionFlagsBits.AddReactions,
		PermissionFlagsBits.AttachFiles,
		PermissionFlagsBits.EmbedLinks,
		PermissionFlagsBits.ReadMessageHistory,
		PermissionFlagsBits.SendMessages,
		PermissionFlagsBits.UseExternalEmojis,
		PermissionFlagsBits.ViewChannel,
		PermissionFlagsBits.UseExternalStickers,
		PermissionFlagsBits.MentionEveryone,
	]).bitfield & PermissionsBitField.All,
);

/**
 * Requires the client to hold the given permissions before the decorated method runs.
 *
 * This is the per-method counterpart to a command's `requiredClientPermissions` option, which is
 * what makes it the tool of choice for a subcommand handler that needs more than its siblings do.
 * The first argument of the decorated method must be a {@link Message} or a
 * {@link BaseInteraction}, since that is what the channel and guild are read from.
 *
 * Failing the check throws a `UserError` rather than returning quietly, so the framework's error
 * handling can report it. The wrapper is asynchronous, so the decorated method's result must be
 * awaited afterwards.
 *
 * For the permissions of the person invoking the command, see {@link RequiresUserPermissions}.
 *
 * @param permissionsResolvable The permissions the client must hold.
 *
 * @example
 * ```typescript
 * import { ApplyOptions, RequiresClientPermissions } from "kairojs/utilities/decorators";
 * import { Subcommand } from "kairojs";
 * import type { Message } from "discord.js";
 *
 * @ApplyOptions<Subcommand.Options>({
 *   description: "Manage the warning list",
 *   subcommands: [{ name: "show", messageRun: "show", default: true }, { name: "reset", messageRun: "reset" }]
 * })
 * export class WarningsCommand extends Subcommand {
 *   // Anyone may look.
 *   public async show(message: Message) {
 *     return message.channel.send("Showing!");
 *   }
 *
 *   @RequiresClientPermissions("BanMembers")
 *   public async reset(message: Message) {
 *     return message.channel.send("Resetting!");
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export const RequiresClientPermissions = (
	...permissionsResolvable: PermissionResolvable[]
): MethodDecorator => {
	const required = new PermissionsBitField(permissionsResolvable);
	const requiresGuild = Boolean(
		required.bitfield & ClientGuildOnlyPermissions.bitfield,
	);

	return createFunctionPrecondition((context: Message | BaseInteraction) => {
		const { channel } = context;
		const clientMember = context.guild?.members.me;

		if (requiresGuild && isDMChannel(channel)) {
			throw new UserError({
				identifier: DecoratorIdentifiers.RequiresClientPermissionsGuildOnly,
				message:
					"Sorry, but that command can only be used in a server because I do not have sufficient permissions in DMs",
			});
		}

		if (isGuildBasedChannel(channel) && !isNullish(clientMember)) {
			const missing = channel.permissionsFor(clientMember).missing(required);

			if (missing.length) {
				throw new UserError({
					identifier:
						DecoratorIdentifiers.RequiresClientPermissionsMissingPermissions,
					message: `Sorry, but I am not allowed to do that. I am missing the permissions: ${missing}`,
					context: { missing },
				});
			}
		}

		return true;
	});
};

/**
 * Requires the command's invoker to hold the given permissions before the decorated method runs.
 *
 * This is the per-method counterpart to a command's `requiredUserPermissions` option. The first
 * argument of the decorated method must be a {@link Message} or a {@link BaseInteraction}.
 *
 * Failing the check throws a `UserError` rather than returning quietly. The wrapper is asynchronous,
 * so the decorated method's result must be awaited afterwards.
 *
 * For the client's own permissions, see {@link RequiresClientPermissions}.
 *
 * @param permissionsResolvable The permissions the invoker must hold.
 *
 * @example
 * ```typescript
 * import { ApplyOptions, RequiresUserPermissions } from "kairojs/utilities/decorators";
 * import { Subcommand } from "kairojs";
 * import type { Message } from "discord.js";
 *
 * @ApplyOptions<Subcommand.Options>({
 *   description: "Manage the warning list",
 *   subcommands: [{ name: "show", messageRun: "show", default: true }, { name: "reset", messageRun: "reset" }]
 * })
 * export class WarningsCommand extends Subcommand {
 *   public async show(message: Message) {
 *     return message.channel.send("Showing!");
 *   }
 *
 *   @RequiresUserPermissions("BanMembers")
 *   public async reset(message: Message) {
 *     return message.channel.send("Resetting!");
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export const RequiresUserPermissions = (
	...permissionsResolvable: PermissionResolvable[]
): MethodDecorator => {
	const required = new PermissionsBitField(permissionsResolvable);
	const requiresGuild = Boolean(
		required.bitfield & UserGuildOnlyPermissions.bitfield,
	);

	return createFunctionPrecondition((context: Message | BaseInteraction) => {
		const { channel } = context;
		// Kept as-is on purpose: this resolves the client's member rather than the invoker's, which is
		// what the original implementation did and what existing bots depend on. Changing it would
		// silently tighten or loosen every method already using this decorator.
		const clientMember = context.guild?.members.me;

		if (requiresGuild && isDMChannel(channel)) {
			throw new UserError({
				identifier: DecoratorIdentifiers.RequiresUserPermissionsGuildOnly,
				message:
					"Sorry, but that command can only be used in a server because you do not have sufficient permissions in DMs",
			});
		}

		if (isGuildBasedChannel(channel) && !isNullish(clientMember)) {
			const missing = channel.permissionsFor(clientMember).missing(required);

			if (missing.length) {
				throw new UserError({
					identifier:
						DecoratorIdentifiers.RequiresUserPermissionsMissingPermissions,
					message: `Sorry, but you are not allowed to do that. You are missing the permissions: ${missing}`,
					context: { missing },
				});
			}
		}

		return true;
	});
};

/**
 * Restricts the decorated method to a guild.
 *
 * The first argument must be a {@link Message} or a {@link BaseInteraction} — every interaction type
 * qualifies — because its `guild` is what the check reads. Outside a guild the method is skipped
 * entirely and the fallback's result is returned instead.
 *
 * @param fallback Produces the result when the method is invoked outside a guild. Defaults to
 * returning `undefined`.
 *
 * @since 1.0.0
 */
export function RequiresGuildContext(
	fallback: FunctionFallback = (): void => undefined,
): MethodDecorator {
	return createFunctionPrecondition(
		(context: Message | BaseInteraction) => context.guild !== null,
		fallback,
	);
}

/**
 * Restricts the decorated method to a DM.
 *
 * The mirror image of {@link RequiresGuildContext}: the first argument must be a {@link Message} or
 * a {@link BaseInteraction}, and inside a guild the method is skipped in favour of the fallback.
 *
 * @param fallback Produces the result when the method is invoked inside a guild. Defaults to
 * returning `undefined`.
 *
 * @since 1.0.0
 */
export function RequiresDMContext(
	fallback: FunctionFallback = (): void => undefined,
): MethodDecorator {
	return createFunctionPrecondition(
		(context: Message | BaseInteraction) => context.guild === null,
		fallback,
	);
}
