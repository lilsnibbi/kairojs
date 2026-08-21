import type { PieceLoaderContext } from "@types";
import { handleRegistryAPICalls } from "@/applicationCommands/registries.ts";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Finishes Kairo's start-up once the gateway connection is live.
 *
 * The application id is only known at this point, and registering application commands needs it, so
 * the registry work waits here rather than running at load time.
 *
 * @since 1.0.0
 */
export class CoreReadyListener extends Listener<
	"client",
	typeof Events.ClientReady
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.ClientReady, once: true });
	}

	public async run() {
		this.container.client.id ??= this.container.client.user?.id ?? null;

		await handleRegistryAPICalls();
	}
}

void container.stores.loadPiece({
	name: "CoreReady",
	piece: CoreReadyListener,
	store: "listeners",
});
