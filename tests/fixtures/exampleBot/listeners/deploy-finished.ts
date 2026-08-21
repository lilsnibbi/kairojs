import { Listener } from "@/structures/listener.ts";
import type { PieceLoaderContext } from "@types";
import { deployEmitter } from "../deployEmitter.ts";

declare module "@types" {
	interface CustomEvents {
		deployFinished: [version: string, durationMs: number];
	}
}

/** A `custom`-source listener, bound to an emitter the bot supplies itself. */
export class DeployFinishedListener extends Listener<
	"custom",
	"deployFinished"
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "custom",
			event: "deployFinished",
			emitter: deployEmitter,
		});
	}

	public run(version: string, durationMs: number) {
		this.container.logger.info(`Deployed ${version} in ${durationMs}ms.`);
	}
}
