import {
	Collection,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type Message,
} from "discord.js";
import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PreconditionArrayResolvable,
	PreconditionArrayResolvableDetails,
	PreconditionCondition,
	PreconditionContainer,
	PreconditionContainerReturn,
	PreconditionContext,
	PreconditionEntryResolvable,
	PreconditionKeys,
	PreconditionRunCondition as PreconditionRunConditionType,
	PreconditionRunMode as PreconditionRunModeType,
	PreconditionSingleResolvable,
	PreconditionSingleResolvableDetails,
	SimplePreconditionKeys,
	SimplePreconditionSingleResolvableDetails,
} from "@types";
import { PreconditionContainerSingle } from "./container-single.ts";
import { PreconditionConditionAnd } from "./conditions/precondition-condition-and.ts";
import { PreconditionConditionOr } from "./conditions/precondition-condition-or.ts";

/**
 * How an array container works through its children.
 *
 * @since 1.0.0
 */
export const PreconditionRunMode = Object.freeze({
	/**
	 * One child at a time, stopping as soon as the answer is known. This is the default: it does the
	 * least work, at the cost of taking longer when several children each await something slow.
	 */
	Sequential: 0,

	/**
	 * Every child at once through `Promise.all`, with the results weighed up afterwards. Faster when
	 * children are independently slow, but every child runs even once the answer is settled.
	 */
	Parallel: 1,
} as const);

/**
 * The boolean operator an array container applies to its children.
 *
 * @since 1.0.0
 */
export const PreconditionRunCondition = Object.freeze({
	/**
	 * Every child must pass. Backed by {@link PreconditionConditionAnd}.
	 */
	And: 0,

	/**
	 * At least one child must pass. Backed by {@link PreconditionConditionOr}.
	 */
	Or: 1,
} as const);

/**
 * Whether the entry names a single precondition rather than a nested array of them.
 *
 * @param entry The entry to classify.
 */
function isSingleEntry(
	entry: PreconditionEntryResolvable,
): entry is PreconditionSingleResolvable {
	return typeof entry === "string" || Reflect.has(entry, "name");
}

/**
 * A branch of a command's precondition tree, holding other containers.
 *
 * The operator alternates with depth. The outermost array is always AND, the arrays nested directly
 * inside it are OR, the ones inside those are AND again, and so on. That single rule is what lets a
 * plain nested array express a boolean expression without any extra syntax.
 *
 * So `["Connect", ["Moderator", ["DJ", "SongAuthor"]]]` reads as three levels:
 * - `[Connect, [...]]` runs AND — both have to pass.
 * - `[Moderator, [...]]` runs OR — either has to pass.
 * - `[DJ, SongAuthor]` runs AND — both have to pass.
 *
 * which is exactly:
 *
 * ```typescript
 * Connect && (Moderator || (DJ && SongAuthor));
 * ```
 *
 * @remarks Operators beyond AND and OR can be taught to the tree by registering more
 * {@link PreconditionCondition}s — see {@link PreconditionContainerArray.conditions}.
 *
 * @since 1.0.0
 */
export class PreconditionContainerArray implements PreconditionContainer {
	/**
	 * Whether this container works through its children one at a time or all at once.
	 */
	public readonly mode: PreconditionRunModeType;

	/**
	 * The children this container holds.
	 */
	public readonly entries: PreconditionContainer[];

	/**
	 * The operator applied to the children, flipped from whatever the parent uses.
	 */
	public readonly runCondition: PreconditionRunConditionType;

	/**
	 * @param data The children to hold, optionally alongside the run mode.
	 * @param parent The container this one is nested in, which decides both the operator to flip and
	 * the run mode to inherit.
	 */
	public constructor(
		data: PreconditionArrayResolvable = [],
		parent: PreconditionContainerArray | null = null,
	) {
		this.entries = [];
		this.runCondition =
			parent?.runCondition === PreconditionRunCondition.And
				? PreconditionRunCondition.Or
				: PreconditionRunCondition.And;

		if (Array.isArray(data)) {
			const children = data as readonly PreconditionEntryResolvable[];

			this.mode = parent?.mode ?? PreconditionRunMode.Sequential;
			this.parse(children);
		} else {
			const details = data as PreconditionArrayResolvableDetails;

			this.mode = details.mode;
			this.parse(details.entries);
		}
	}

	/**
	 * Adds an already-built container as a child.
	 *
	 * @param entry The container to add.
	 */
	public add(entry: PreconditionContainer): this {
		this.entries.push(entry);
		return this;
	}

	/**
	 * Adds a precondition as a child, building the container for it.
	 *
	 * @param keyOrEntries The name of a precondition that reads no configuration, that name in object
	 * form, or an already-built array container.
	 */
	public append(
		keyOrEntries:
			| SimplePreconditionSingleResolvableDetails
			| SimplePreconditionKeys
			| PreconditionContainerArray,
	): this;
	/**
	 * Adds a precondition as a child, building the container for it.
	 *
	 * @param entry The name of a precondition that reads configuration, alongside that
	 * configuration.
	 */
	public append<K extends PreconditionKeys>(
		entry: PreconditionSingleResolvableDetails<K>,
	): this;
	public append(
		entry: PreconditionContainerArray | PreconditionSingleResolvable,
	): this {
		this.entries.push(
			entry instanceof PreconditionContainerArray
				? entry
				: new PreconditionContainerSingle(entry),
		);
		return this;
	}

	/**
	 * Runs the children against a message command.
	 *
	 * @param message The message that triggered the command.
	 * @param command The command the message invoked.
	 * @param context The context to hand to each child.
	 */
	public messageRun(
		message: Message,
		command: MessageCommand,
		context: PreconditionContext = {},
	): PreconditionContainerReturn {
		return this.mode === PreconditionRunMode.Sequential
			? this.condition.messageSequential(
					message,
					command,
					this.entries,
					context,
				)
			: this.condition.messageParallel(message, command, this.entries, context);
	}

	/**
	 * Runs the children against a chat input command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context The context to hand to each child.
	 */
	public chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext = {},
	): PreconditionContainerReturn {
		return this.mode === PreconditionRunMode.Sequential
			? this.condition.chatInputSequential(
					interaction,
					command,
					this.entries,
					context,
				)
			: this.condition.chatInputParallel(
					interaction,
					command,
					this.entries,
					context,
				);
	}

	/**
	 * Runs the children against a context menu command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context The context to hand to each child.
	 */
	public contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext = {},
	): PreconditionContainerReturn {
		return this.mode === PreconditionRunMode.Sequential
			? this.condition.contextMenuSequential(
					interaction,
					command,
					this.entries,
					context,
				)
			: this.condition.contextMenuParallel(
					interaction,
					command,
					this.entries,
					context,
				);
	}

	/**
	 * Turns each raw entry into a container and adds it, nesting arrays under this one so the
	 * operator flips as the tree deepens.
	 *
	 * @param entries The raw entries to convert.
	 */
	protected parse(entries: Iterable<PreconditionEntryResolvable>): this {
		for (const entry of entries) {
			this.add(
				isSingleEntry(entry)
					? new PreconditionContainerSingle(entry)
					: new PreconditionContainerArray(entry, this),
			);
		}

		return this;
	}

	/**
	 * The operator this container applies, looked up in
	 * {@link PreconditionContainerArray.conditions}.
	 */
	protected get condition(): PreconditionCondition {
		return PreconditionContainerArray.conditions.get(this.runCondition)!;
	}

	/**
	 * Every operator an array container can apply, keyed by {@link PreconditionRunCondition}.
	 *
	 * Registering an entry here teaches the tree a new operator. Because the key type is derived from
	 * the constant above, a new key has to be asserted into it.
	 *
	 * @example
	 * ```typescript
	 * import { PreconditionContainerArray } from "kairojs";
	 * import type { PreconditionCondition, PreconditionRunCondition } from "kairojs";
	 *
	 * const PreconditionConditionRandom: PreconditionCondition = {
	 *   // ...
	 * };
	 *
	 * PreconditionContainerArray.conditions.set(2 as PreconditionRunCondition, PreconditionConditionRandom);
	 * ```
	 *
	 * @since 1.0.0
	 */
	public static readonly conditions = new Collection<
		PreconditionRunConditionType,
		PreconditionCondition
	>([
		[PreconditionRunCondition.And, PreconditionConditionAnd],
		[PreconditionRunCondition.Or, PreconditionConditionOr],
	]);
}
