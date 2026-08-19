import type { PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import type { Command } from "@/structures/command.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Writes to the logger when a command's `registerApplicationCommands` throws.
 *
 * @since 1.0.0
 */
export class CoreCommandApplicationCommandRegistryErrorListener extends Listener<
	"client",
	typeof Events.CommandApplicationCommandRegistryError
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.CommandApplicationCommandRegistryError,
		});
	}

	public run(error: unknown, command: Command) {
		const { name, location } = command;
		this.container.logger.error(
			`Encountered error while handling the command application command registry for command "${name}" at path "${location.full}"`,
			error,
		);
	}
}
