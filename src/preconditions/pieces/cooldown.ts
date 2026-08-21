import type {
	ChatInputCommand,
	ContextMenuCommand,
	CooldownPreconditionContext,
	MessageCommand,
	PreconditionResult,
} from "@types";
import {
	TimestampStyles,
	time,
	type ChatInputCommandInteraction,
	type CommandInteraction,
	type ContextMenuCommandInteraction,
	type Message,
} from "discord.js";
import { RateLimitManager } from "@utilities/rateLimits/index.ts";
import { Identifiers } from "@/constants/identifiers.ts";
import { BucketScope } from "@/constants/enums.ts";
import { container } from "@/container.ts";
import type { Command } from "@/structures/command.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";

/**
 * Rate-limits how often a command may be invoked.
 *
 * Attached automatically by a command's `cooldownDelay` and `cooldownLimit` options. Each command
 * gets its own bucket manager, and the scope decides what a single bucket covers — one user, one
 * channel, one guild, or the whole bot.
 *
 * @since 1.0.0
 */
export class CoreCooldownPrecondition extends AllFlowsPrecondition {
	/**
	 * One bucket manager per command.
	 *
	 * Keyed weakly so a command that is unloaded takes its buckets with it instead of leaking them
	 * for the lifetime of the process.
	 */
	public buckets = new WeakMap<Command, RateLimitManager<string>>();

	public messageRun(
		message: Message,
		command: MessageCommand,
		context: CooldownPreconditionContext,
	): PreconditionResult {
		return this.consume(
			message.author.id,
			command,
			context,
			this.bucketIdFromMessage(message, context),
			"message",
		);
	}

	public chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: CooldownPreconditionContext,
	): PreconditionResult {
		return this.consume(
			interaction.user.id,
			command,
			context,
			this.bucketIdFromInteraction(interaction, context),
			"chat input",
		);
	}

	public contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: CooldownPreconditionContext,
	): PreconditionResult {
		return this.consume(
			interaction.user.id,
			command,
			context,
			this.bucketIdFromInteraction(interaction, context),
			"context menu",
		);
	}

	/**
	 * Takes one use out of the relevant bucket, or refuses the command when it is already spent.
	 *
	 * Nothing is consumed unless the check is being made on the command's own behalf: a help command
	 * asking whether a command *would* run must not burn the caller's allowance to find out.
	 */
	private consume(
		authorId: string,
		command: Command,
		context: CooldownPreconditionContext,
		bucketId: string,
		commandType: string,
	): PreconditionResult {
		if (context.external) return this.ok();
		if (!context.delay) return this.ok();
		if (context.filteredUsers?.includes(authorId)) return this.ok();

		const rateLimit = this.getManager(command, context).acquire(bucketId);

		if (rateLimit.limited) {
			const remaining = rateLimit.remainingTime;
			const nextAvailable = time(
				Math.floor(rateLimit.expires / 1000),
				TimestampStyles.RelativeTime,
			);

			return this.error({
				identifier: Identifiers.PreconditionCooldown,
				message: `There is a cooldown in effect for this ${commandType} command. It'll be available ${nextAvailable}.`,
				context: { remaining },
			});
		}

		rateLimit.consume();
		return this.ok();
	}

	/**
	 * Works out which bucket a message command invocation belongs in.
	 */
	private bucketIdFromMessage(
		message: Message,
		context: CooldownPreconditionContext,
	) {
		switch (context.scope) {
			case BucketScope.Global:
				return "global";
			case BucketScope.Channel:
				return message.channelId;
			case BucketScope.Guild:
				return message.guildId ?? message.channelId;
			default:
				return message.author.id;
		}
	}

	/**
	 * Works out which bucket an interaction belongs in.
	 */
	private bucketIdFromInteraction(
		interaction: CommandInteraction,
		context: CooldownPreconditionContext,
	) {
		switch (context.scope) {
			case BucketScope.Global:
				return "global";
			case BucketScope.Channel:
				return interaction.channelId;
			case BucketScope.Guild:
				return interaction.guildId ?? interaction.channelId;
			default:
				return interaction.user.id;
		}
	}

	/**
	 * Fetches the bucket manager for a command, creating it on first use.
	 */
	private getManager(command: Command, context: CooldownPreconditionContext) {
		let manager = this.buckets.get(command);

		if (!manager) {
			manager = new RateLimitManager<string>(context.delay, context.limit);
			this.buckets.set(command, manager);
		}

		return manager;
	}
}

void container.stores.loadPiece({
	name: "Cooldown",
	piece: CoreCooldownPrecondition,
	store: "preconditions",
});
