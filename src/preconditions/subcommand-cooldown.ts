import {
	TimestampStyles,
	time,
	type ChatInputCommandInteraction,
	type CommandInteraction,
	type ContextMenuCommandInteraction,
	type Message,
} from "discord.js";
import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PluginSubcommandCooldownPreconditionContext,
} from "@types";
import { RateLimitManager } from "@utilities/ratelimits/index.ts";
import { BucketScope } from "@/constants/enums.ts";
import { SubcommandIdentifiers } from "@/constants/subcommands.ts";
import { container } from "@/container.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";
import type { Subcommand } from "@/structures/subcommand.ts";

/**
 * Rate-limits one subcommand of a command, independently of the command as a whole.
 *
 * It differs from the command-level cooldown in two ways: the bucket lives on its own manager, and
 * the key it is stored under carries the subcommand's name. Without that, every subcommand of a
 * command would draw on one shared allowance, so running `config show` would put `config set` on
 * cooldown too.
 *
 * @since 1.0.0
 */
export class PluginSubcommandCooldownPrecondition extends AllFlowsPrecondition {
	/**
	 * One rate-limit manager per command, keyed weakly so a command that is unloaded takes its
	 * buckets with it.
	 */
	public subcommandBuckets = new WeakMap<
		Subcommand,
		RateLimitManager<string>
	>();

	public override messageRun(
		message: Message,
		subcommand: MessageCommand,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		const cooldownId = this.resolveIdFromMessage(message, context);
		return this.sharedRun(
			message.author.id,
			subcommand as unknown as Subcommand,
			context,
			cooldownId,
			"message",
		);
	}

	public override chatInputRun(
		interaction: ChatInputCommandInteraction,
		subcommand: ChatInputCommand,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		const cooldownId = this.resolveIdFromInteraction(interaction, context);
		return this.sharedRun(
			interaction.user.id,
			subcommand as unknown as Subcommand,
			context,
			cooldownId,
			"chat input",
		);
	}

	public override contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		subcommand: ContextMenuCommand,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		const cooldownId = this.resolveIdFromInteraction(interaction, context);
		return this.sharedRun(
			interaction.user.id,
			subcommand as unknown as Subcommand,
			context,
			cooldownId,
			"context menu",
		);
	}

	/**
	 * The check itself, shared by all three entry points once the bucket key has been worked out.
	 *
	 * @param authorId The id of whoever invoked the subcommand.
	 * @param subcommand The command the subcommand belongs to.
	 * @param context The cooldown's configuration.
	 * @param cooldownId The bucket key this invocation counts against.
	 * @param commandType How the subcommand was invoked, for the refusal message.
	 */
	private sharedRun(
		authorId: string,
		subcommand: Subcommand,
		context: PluginSubcommandCooldownPreconditionContext,
		cooldownId: string,
		commandType: string,
	) {
		// Being asked on someone else's behalf — a help listing, say — must not spend the bucket.
		if (context.external) return this.ok();

		// A missing, null or zero delay means no cooldown was configured at all.
		if (!context.delay) return this.ok();

		if (context.filteredUsers?.includes(authorId)) return this.ok();

		const rateLimit = this.resolveManager(subcommand, context).acquire(
			cooldownId,
		);

		if (rateLimit.limited) {
			const remaining = rateLimit.remainingTime;
			const nextAvailable = time(
				Math.floor(rateLimit.expires / 1000),
				TimestampStyles.RelativeTime,
			);

			return this.error({
				identifier: SubcommandIdentifiers.SubcommandPreconditionCooldown,
				message: `There is a cooldown in effect for this ${commandType} subcommand. It'll be available ${nextAvailable}.`,
				context: { remaining },
			});
		}

		rateLimit.consume();
		return this.ok();
	}

	/**
	 * Works out which bucket a message invocation counts against.
	 *
	 * A guild-scoped cooldown in a DM has no guild to key on, so it falls back to the channel, which
	 * is the closest thing to a container the message has.
	 */
	private resolveIdFromMessage(
		message: Message,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		const subcommandIdentifier = this.resolveSubcommandMappingName(context);

		switch (context.scope) {
			case BucketScope.Global:
				return `global.${subcommandIdentifier}`;
			case BucketScope.Channel:
				return `${message.channelId}.${subcommandIdentifier}`;
			case BucketScope.Guild:
				return message.guildId
					? `${message.guildId}.${subcommandIdentifier}`
					: `${message.channelId}.${subcommandIdentifier}`;
			default:
				return `${message.author.id}.${subcommandIdentifier}`;
		}
	}

	/**
	 * Works out which bucket an interaction counts against.
	 */
	private resolveIdFromInteraction(
		interaction: CommandInteraction,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		const subcommandIdentifier = this.resolveSubcommandMappingName(context);

		switch (context.scope) {
			case BucketScope.Global:
				return `global.${subcommandIdentifier}`;
			case BucketScope.Channel:
				return `${interaction.channelId}.${subcommandIdentifier}`;
			case BucketScope.Guild:
				return interaction.guildId
					? `${interaction.guildId}.${subcommandIdentifier}`
					: `${interaction.channelId}.${subcommandIdentifier}`;
			default:
				return `${interaction.user.id}.${subcommandIdentifier}`;
		}
	}

	/**
	 * The part of a bucket key that names the subcommand, qualified by its group when it has one.
	 */
	private resolveSubcommandMappingName(
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		return context.subcommandGroupName
			? `${context.subcommandGroupName}.${context.subcommandMethodName}`
			: context.subcommandMethodName;
	}

	/**
	 * The rate-limit manager for a command, created on first use.
	 */
	private resolveManager(
		subcommand: Subcommand,
		context: PluginSubcommandCooldownPreconditionContext,
	) {
		let manager = this.subcommandBuckets.get(subcommand);

		if (!manager) {
			manager = new RateLimitManager(context.delay, context.limit);
			this.subcommandBuckets.set(subcommand, manager);
		}

		return manager;
	}
}

void container.stores.loadPiece({
	name: "PluginSubcommandCooldown",
	piece: PluginSubcommandCooldownPrecondition,
	store: "preconditions",
});
