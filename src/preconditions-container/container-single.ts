import type {
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import type {
	ChatInputCommand,
	ContextMenuCommand,
	MessageCommand,
	PreconditionContainer,
	PreconditionContext,
	PreconditionSingleResolvable,
	StoreRegistryKey,
} from "@types";
import { err } from "@utilities/result/index.ts";
import { container } from "@/container.ts";
import { Identifiers } from "@/constants/identifiers.ts";
import { UserError } from "@/errors/user-error.ts";
import type { Store } from "@/loader/store.ts";
import type { Precondition } from "@/structures/precondition.ts";

/**
 * Looks the preconditions store up on the container, without assuming it has been registered yet.
 */
function getPreconditionStore() {
	return container.stores.get("preconditions" as StoreRegistryKey) as
		| Store<Precondition>
		| undefined;
}

/**
 * A leaf of a command's precondition tree: one named precondition, plus the configuration it reads.
 *
 * The name is resolved against the preconditions store at run time rather than at construction, so a
 * precondition that is loaded, unloaded or replaced while the bot is running is picked up on the
 * next invocation.
 *
 * @since 1.0.0
 */
export class PreconditionContainerSingle implements PreconditionContainer {
	/**
	 * The configuration handed to the precondition on every run.
	 *
	 * This is an empty object when the container was built from a bare name, and otherwise the very
	 * object that was passed in — it is not copied, so a later mutation is visible here.
	 */
	public readonly context: Record<PropertyKey, unknown>;

	/**
	 * The name of the precondition to look up.
	 */
	public readonly name: string;

	/**
	 * @param data The precondition to run, as a bare name or in object form.
	 */
	public constructor(data: PreconditionSingleResolvable) {
		if (typeof data === "string") {
			this.context = {};
			this.name = data;
		} else {
			this.context = Reflect.get(data, "context") ?? {};
			this.name = data.name;
		}
	}

	/**
	 * Runs the precondition against a message command.
	 *
	 * @param message The message that triggered the command.
	 * @param command The command the message invoked.
	 * @param context Context from further up the tree, which this container's own configuration
	 * overrides.
	 */
	public messageRun(
		message: Message,
		command: MessageCommand,
		context: PreconditionContext = {},
	) {
		const precondition = getPreconditionStore()?.get(this.name);
		if (precondition) {
			return precondition.messageRun
				? precondition.messageRun(message, command, {
						...context,
						...this.context,
					})
				: precondition.error({
						identifier: Identifiers.PreconditionMissingMessageHandler,
						message: `The precondition "${precondition.name}" is missing a "messageRun" handler, but it was requested for the "${command.name}" command.`,
					});
		}

		return err(
			new UserError({
				identifier: Identifiers.PreconditionUnavailable,
				message: `The precondition "${this.name}" is not available.`,
			}),
		);
	}

	/**
	 * Runs the precondition against a chat input command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context Context from further up the tree, which this container's own configuration
	 * overrides.
	 */
	public chatInputRun(
		interaction: ChatInputCommandInteraction,
		command: ChatInputCommand,
		context: PreconditionContext = {},
	) {
		const precondition = getPreconditionStore()?.get(this.name);
		if (precondition) {
			return precondition.chatInputRun
				? precondition.chatInputRun(interaction, command, {
						...context,
						...this.context,
					})
				: precondition.error({
						identifier: Identifiers.PreconditionMissingChatInputHandler,
						message: `The precondition "${precondition.name}" is missing a "chatInputRun" handler, but it was requested for the "${command.name}" command.`,
					});
		}

		return err(
			new UserError({
				identifier: Identifiers.PreconditionUnavailable,
				message: `The precondition "${this.name}" is not available.`,
			}),
		);
	}

	/**
	 * Runs the precondition against a context menu command.
	 *
	 * @param interaction The interaction that triggered the command.
	 * @param command The command the interaction invoked.
	 * @param context Context from further up the tree, which this container's own configuration
	 * overrides.
	 */
	public contextMenuRun(
		interaction: ContextMenuCommandInteraction,
		command: ContextMenuCommand,
		context: PreconditionContext = {},
	) {
		const precondition = getPreconditionStore()?.get(this.name);
		if (precondition) {
			return precondition.contextMenuRun
				? precondition.contextMenuRun(interaction, command, {
						...context,
						...this.context,
					})
				: precondition.error({
						identifier: Identifiers.PreconditionMissingContextMenuHandler,
						message: `The precondition "${precondition.name}" is missing a "contextMenuRun" handler, but it was requested for the "${command.name}" command.`,
					});
		}

		return err(
			new UserError({
				identifier: Identifiers.PreconditionUnavailable,
				message: `The precondition "${this.name}" is not available.`,
			}),
		);
	}
}
