import { Listener } from "@/structures/listener.ts";
import { Events } from "@/constants/events.ts";
import type { PieceLoaderContext } from "@types";
import type { Interaction } from "discord.js";

/**
 * A `client`-source listener that is NOT `once`, so it stays bound for the client's whole lifetime.
 *
 * The `ready` listener alongside it is `once`, and therefore unloads itself the moment it fires —
 * correct behaviour, but it means it cannot be used to check that a client listener is still bound
 * after start-up. This one can.
 */
export class InteractionCreateListener extends Listener<
	"client",
	typeof Events.InteractionCreate
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "client", event: Events.InteractionCreate });
	}

	public run(interaction: Interaction) {
		this.container.logger.debug(`Received interaction ${interaction.id}.`);
	}
}
