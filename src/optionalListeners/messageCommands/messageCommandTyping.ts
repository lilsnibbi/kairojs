import type {
	MessageCommand,
	MessageCommandRunPayload,
	PieceLoaderContext,
} from "@types";
import { ChannelType, type Message } from "discord.js";
import { isStageChannel } from "@utilities/discordjs/index.ts";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Shows the typing indicator while a message command runs, so a slow command still looks alive.
 *
 * The listener disables itself outright when typing is switched off client-wide, which is cheaper
 * than checking the option on every invocation. Channels that cannot be typed in — stage channels
 * and group DMs — are skipped, and a failed attempt is reported rather than thrown, because failing
 * to show an indicator is no reason to fail the command.
 *
 * @since 1.0.0
 */
export class CoreMessageCommandTypingListener extends Listener<
	"client",
	typeof Events.MessageCommandRun
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.MessageCommandRun });
		this.enabled = this.container.client.options.typing ?? false;
	}

	public async run(
		message: Message,
		command: MessageCommand,
		payload: MessageCommandRunPayload,
	) {
		if (!command.typing || isStageChannel(message.channel)) return;
		if (message.channel.type === ChannelType.GroupDM) return;

		try {
			await message.channel.sendTyping();
		} catch (error) {
			message.client.emit(Events.MessageCommandTypingError, error as Error, {
				...payload,
				command,
				message,
			});
		}
	}
}
