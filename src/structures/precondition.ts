import type {
	ChatInputCommandInteraction,
	CommandInteraction,
	ContextMenuCommandInteraction,
	Message,
	TextBasedChannel,
} from "discord.js";
import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PieceLoaderContext,
	PreconditionContext,
	PreconditionErrorOptions,
	PreconditionOptions,
	PreconditionResult,
} from "@types";
import { Result } from "@utilities/result/index.ts";
import { PreconditionError } from "@/errors/precondition-error.ts";
import { Piece } from "@/loader/piece.ts";

/**
 * A gate a command must pass before it is allowed to run.
 *
 * Each entry point gets its own handler, because what a check can look at differs between them: a
 * message carries a resolved channel, an interaction carries only an ID. Implement only the flows
 * the check makes sense for — a precondition asked for a flow it does not implement is reported as a
 * misconfiguration rather than quietly treated as a pass.
 *
 * Give `position` a number to make the precondition global: it then runs for every command, in
 * ascending order of that number, before the command's own preconditions.
 *
 * @example
 * ```typescript
 * import { Precondition, type PieceLoaderContext } from "kairojs";
 *
 * export class OwnerOnlyPrecondition extends Precondition {
 *   public messageRun(message: Message) {
 *     return message.author.id === process.env.OWNER_ID
 *       ? this.ok()
 *       : this.error({ message: "Only the bot owner may use this command." });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class Precondition<
	Options extends PreconditionOptions = PreconditionOptions,
> extends Piece<Options, "preconditions"> {
	/**
	 * Where this precondition sits in the global list, or `null` when it only runs for the commands
	 * that name it.
	 */
	public readonly position: number | null;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The piece's own options, including its global position.
	 */
	public constructor(
		context: PieceLoaderContext<"preconditions">,
		options: Options = {} as Options,
	) {
		super(context, options);
		this.position = options.position ?? null;
	}

	/**
	 * Decides whether a prefixed message command may run.
	 *
	 * @param message The message that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever the caller attached to this check.
	 */
	public messageRun?(
		message: Message,
		command: MessageCommand,
		context: PreconditionContext,
	): PreconditionResult;

	/**
	 * Decides whether a slash command may run.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever the caller attached to this check.
	 */
	public chatInputRun?(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext,
	): PreconditionResult;

	/**
	 * Decides whether a context-menu command may run.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever the caller attached to this check.
	 */
	public contextMenuRun?(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext,
	): PreconditionResult;

	/**
	 * Allows the command through.
	 */
	public ok(): PreconditionResult {
		return Result.ok();
	}

	/**
	 * Refuses the command, as a {@link PreconditionError} naming this precondition.
	 *
	 * The identifier defaults to the precondition's own name, so a handler can tell a cooldown
	 * denial from a permission denial without reading the message.
	 *
	 * @param options The reason for the refusal, and anything a handler should see with it.
	 */
	public error(
		options: Omit<PreconditionErrorOptions, "precondition"> = {},
	): PreconditionResult {
		return Result.err(
			new PreconditionError({ precondition: this, ...options }),
		);
	}

	/**
	 * Fetches the channel an interaction happened in.
	 *
	 * An interaction only carries a channel ID, and the cache is deliberately bypassed so a check
	 * never decides on a stale copy. `allowUnknownGuild` keeps this working in guilds the bot is not
	 * a member of, which is the case for user-installed commands.
	 *
	 * @param interaction The interaction to resolve the channel of.
	 */
	protected async fetchChannelFromInteraction(
		interaction: CommandInteraction,
	): Promise<TextBasedChannel> {
		return (await interaction.client.channels.fetch(interaction.channelId, {
			cache: false,
			allowUnknownGuild: true,
		})) as TextBasedChannel;
	}
}

/**
 * A {@link Precondition} that must answer for every entry point.
 *
 * Extend this instead of `Precondition` when a check is meant to apply everywhere: leaving a flow
 * out then becomes a compile error rather than a gap discovered at runtime.
 *
 * @since 1.0.0
 */
export abstract class AllFlowsPrecondition extends Precondition {
	public abstract override messageRun(
		message: Message,
		command: MessageCommand,
		context: PreconditionContext,
	): PreconditionResult;

	public abstract override chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext,
	): PreconditionResult;

	public abstract override contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext,
	): PreconditionResult;
}
