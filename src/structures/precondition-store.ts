import type {
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import type {
	AsyncPreconditionResult,
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PreconditionContext,
} from "@types";
import { Result } from "@utilities/result/index.ts";
import { Identifiers } from "@/constants/identifiers.ts";
import { Store } from "@/loader/store.ts";
import { Precondition } from "./precondition.ts";

/**
 * The store holding every {@link Precondition} the bot has loaded.
 *
 * Beyond storing them, it keeps the global preconditions — the ones that declared a `position` —
 * ordered, and runs them in that order for every command. The three `*Run` methods below are the
 * global pass; a command's own preconditions are run separately by its precondition container.
 *
 * @since 1.0.0
 */
export class PreconditionStore extends Store<Precondition, "preconditions"> {
	/**
	 * The global preconditions, kept sorted by their `position` so insertion order never matters.
	 */
	private readonly globalPreconditions: Precondition[] = [];

	public constructor() {
		super(Precondition, { name: "preconditions" });
	}

	/**
	 * Runs every global precondition against a message command, stopping at the first refusal.
	 *
	 * The checks run one after another rather than in parallel, and the first denial ends the pass:
	 * a precondition is free to assume the ones ordered before it already passed, and a cheap check
	 * placed first spares the expensive ones behind it from running at all.
	 *
	 * @param message The message that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever should be passed on to each precondition.
	 * @returns An empty success, or the first refusal encountered.
	 */
	public async messageRun(
		message: Message,
		command: MessageCommand,
		context: PreconditionContext = {},
	): AsyncPreconditionResult {
		for (const precondition of this.globalPreconditions) {
			const outcome = precondition.messageRun
				? await precondition.messageRun(message, command, context)
				: await precondition.error({
						identifier: Identifiers.PreconditionMissingMessageHandler,
						message: `The precondition "${precondition.name}" has no "messageRun" handler, yet the "${command.name}" command asked it to check one.`,
					});

			if (outcome.isErr()) return outcome;
		}

		return Result.ok();
	}

	/**
	 * Runs every global precondition against a slash command, stopping at the first refusal.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever should be passed on to each precondition.
	 * @returns An empty success, or the first refusal encountered.
	 */
	public async chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext = {},
	): AsyncPreconditionResult {
		for (const precondition of this.globalPreconditions) {
			const outcome = precondition.chatInputRun
				? await precondition.chatInputRun(interaction, command, context)
				: await precondition.error({
						identifier: Identifiers.PreconditionMissingChatInputHandler,
						message: `The precondition "${precondition.name}" has no "chatInputRun" handler, yet the "${command.name}" command asked it to check one.`,
					});

			if (outcome.isErr()) return outcome;
		}

		return Result.ok();
	}

	/**
	 * Runs every global precondition against a context-menu command, stopping at the first refusal.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param command The command being invoked.
	 * @param context Whatever should be passed on to each precondition.
	 * @returns An empty success, or the first refusal encountered.
	 */
	public async contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext = {},
	): AsyncPreconditionResult {
		for (const precondition of this.globalPreconditions) {
			const outcome = precondition.contextMenuRun
				? await precondition.contextMenuRun(interaction, command, context)
				: await precondition.error({
						identifier: Identifiers.PreconditionMissingContextMenuHandler,
						message: `The precondition "${precondition.name}" has no "contextMenuRun" handler, yet the "${command.name}" command asked it to check one.`,
					});

			if (outcome.isErr()) return outcome;
		}

		return Result.ok();
	}

	/**
	 * Stores a precondition, slotting it into the global list when it declared a position.
	 *
	 * @param key The name to store it under.
	 * @param value The precondition to store.
	 */
	public override set(key: string, value: Precondition): this {
		if (value.position !== null) {
			const successor = this.globalPreconditions.findIndex(
				(precondition) => precondition.position! >= value.position!,
			);

			// Nothing sits at or after this position yet, so it belongs at the end.
			if (successor === -1) this.globalPreconditions.push(value);
			else this.globalPreconditions.splice(successor, 0, value);
		}

		return super.set(key, value);
	}

	/**
	 * Removes a precondition, taking it out of the global list as well.
	 *
	 * @param key The name it is stored under.
	 */
	public override delete(key: string): boolean {
		const index = this.globalPreconditions.findIndex(
			(precondition) => precondition.name === key,
		);
		if (index !== -1) this.globalPreconditions.splice(index, 1);

		return super.delete(key);
	}

	/**
	 * Empties the store, global list included.
	 */
	public override clear(): void {
		this.globalPreconditions.length = 0;
		super.clear();
	}
}
