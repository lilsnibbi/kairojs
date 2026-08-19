import type { ClientOptions } from "discord.js";
import type { Awaitable, KairoClientLike } from "@types";
import {
	postInitialization,
	postLogin,
	preGenericsInitialization,
	preInitialization,
	preLogin,
} from "./symbols.ts";

/**
 * The base class for a plugin.
 *
 * A plugin hooks into the client's start-up by declaring static methods keyed by the hook symbols.
 * Every hook is optional — declare only the ones you need. Each is called with the client as `this`,
 * so a plugin can register stores, add container properties, or attach listeners.
 *
 * @example
 * ```typescript
 * import { Plugin, postInitialization, type KairoClient } from "kairojs";
 *
 * export class MetricsPlugin extends Plugin {
 *   public static [postInitialization](this: KairoClient) {
 *     this.stores.register(new MetricStore());
 *   }
 * }
 *
 * KairoClient.use(MetricsPlugin);
 * ```
 *
 * @since 1.0.0
 */
// biome-ignore lint/complexity/noStaticOnlyClass: plugins are declared by subclassing and assigning these static hooks
export abstract class Plugin {
	public static [preGenericsInitialization]?: (
		this: KairoClientLike,
		options: ClientOptions,
	) => void;
	public static [preInitialization]?: (
		this: KairoClientLike,
		options: ClientOptions,
	) => void;
	public static [postInitialization]?: (
		this: KairoClientLike,
		options: ClientOptions,
	) => void;
	public static [preLogin]?: (
		this: KairoClientLike,
		options: ClientOptions,
	) => Awaitable<void>;
	public static [postLogin]?: (
		this: KairoClientLike,
		options: ClientOptions,
	) => Awaitable<void>;
}
