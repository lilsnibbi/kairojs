import { Listener } from "@/structures/listener.ts";
import type { PieceLoaderContext } from "@types";
import type { RateLimitData } from "discord.js";

/** A `rest`-source listener — proves the REST manager binds separately from the client. */
export class RateLimitedListener extends Listener<"rest", "rateLimited"> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, { type: "rest", event: "rateLimited" });
	}

	public run(info: RateLimitData) {
		this.container.logger.warn(
			`Rate limited on ${info.route} for ${info.timeToReset}ms.`,
		);
	}
}
