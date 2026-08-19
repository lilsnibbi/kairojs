import type { ClientOptions } from "discord.js";
import type { KairoClientLike } from "@types";
import { Plugin } from "@/plugin/plugin.ts";
import { postLogin } from "@/plugin/symbols.ts";
import { start } from "./hmr.ts";

/**
 * Starts hot module replacement as soon as the client is connected.
 *
 * Hot reloading is opt-in, so it keeps the plugin shape rather than being wired into the client:
 * register it and it reads its configuration from the client's `hmr` option, leaving a bot that
 * never imports `kairojs/hmr` with no watchers and no behaviour change at all.
 *
 * Watching only begins after login because it reloads pieces, and pieces are not loaded until then —
 * an earlier watcher would have nothing to reload.
 *
 * @example
 * ```typescript
 * import { KairoClient } from "kairojs";
 * import { HmrPlugin } from "kairojs/hmr";
 *
 * KairoClient.use(HmrPlugin);
 *
 * const client = new KairoClient({ intents: [], hmr: { enabled: process.env.NODE_ENV !== "production" } });
 * ```
 *
 * @since 1.0.0
 */
export class HmrPlugin extends Plugin {
	/**
	 * Starts the watchers once the gateway connection is up and every piece has been loaded.
	 */
	public static override [postLogin](
		this: KairoClientLike,
		options: ClientOptions,
	): void {
		start(options.hmr);
	}
}
