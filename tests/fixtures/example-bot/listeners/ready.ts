import { Listener } from "@/structures/listener.ts";
import { Events } from "@/constants/events.ts";
import type { PieceLoaderContext } from "@types";
import type { Client } from "discord.js";

/** A `client`-source listener, the most common kind. */
export class ReadyListener extends Listener<
	"client",
	typeof Events.ClientReady
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.ClientReady, once: true });
	}

	public run(client: Client<true>) {
		this.container.logger.info(`Logged in as ${client.user.tag}.`);
	}
}
