import type { AsyncPreconditionResult, PreconditionResult } from "@types";
import type {
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { AllFlowsPrecondition } from "@/structures/precondition.ts";

/**
 * Confines a command to channels marked age-restricted.
 *
 * Attached automatically by a command's `nsfw` option. The flag is read reflectively and compared
 * against `true` on purpose: a DM channel has no `nsfw` property at all, and treating that absence
 * as a pass would let an age-restricted command run anywhere private.
 *
 * @since 1.0.0
 */
export class CoreNsfwPrecondition extends AllFlowsPrecondition {
	public messageRun(message: Message): PreconditionResult {
		return Reflect.get(message.channel, "nsfw") === true
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionNSFW,
					message: "You cannot run this message command outside NSFW channels.",
				});
	}

	public async chatInputRun(
		interaction: ChatInputCommandInteraction,
	): AsyncPreconditionResult {
		const channel = await this.fetchChannelFromInteraction(interaction);

		return Reflect.get(channel, "nsfw") === true
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionNSFW,
					message:
						"You cannot run this chat input command outside NSFW channels.",
				});
	}

	public async contextMenuRun(
		interaction: ContextMenuCommandInteraction,
	): AsyncPreconditionResult {
		const channel = await this.fetchChannelFromInteraction(interaction);

		return Reflect.get(channel, "nsfw") === true
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionNSFW,
					message: "You cannot run this command outside NSFW channels.",
				});
	}
}

void container.stores.loadPiece({
	name: "NSFW",
	piece: CoreNsfwPrecondition,
	store: "preconditions",
});
