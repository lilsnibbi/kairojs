import type { PieceLoaderContext } from "@types";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Announces that application command registration has started.
 *
 * Registered once only, because initialisation happens once per process.
 *
 * @since 1.0.0
 */
export class CoreApplicationCommandRegistriesInitialisingListener extends Listener<
	"client",
	typeof Events.ApplicationCommandRegistriesInitialising
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.ApplicationCommandRegistriesInitialising,
			once: true,
		});
	}

	public run() {
		this.container.logger.info("ApplicationCommandRegistries: Initializing...");
	}
}
