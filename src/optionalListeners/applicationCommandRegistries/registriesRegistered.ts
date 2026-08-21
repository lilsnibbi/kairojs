import type { PieceLoaderContext } from "@types";
import type { ApplicationCommandRegistry } from "@/applicationCommands/registry.ts";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Announces that application command registration has finished, and how long it took.
 *
 * The elapsed time is worth surfacing: registration talks to Discord once per guild that needs it,
 * so a slow start-up usually points at a long `guildIds` list rather than at the bot itself.
 *
 * @since 1.0.0
 */
export class CoreApplicationCommandRegistriesRegisteredListener extends Listener<
	"client",
	typeof Events.ApplicationCommandRegistriesRegistered
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.ApplicationCommandRegistriesRegistered,
			once: true,
		});
	}

	public run(
		_registries: Map<string, ApplicationCommandRegistry>,
		timeTaken: number,
	) {
		this.container.logger.info(
			`ApplicationCommandRegistries: Took ${timeTaken.toLocaleString()}ms to initialize.`,
		);
	}
}
