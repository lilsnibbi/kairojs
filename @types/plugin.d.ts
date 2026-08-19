import type { ClientOptions } from "discord.js";
import type { PluginHook as PluginHookConstant } from "@/constants/enums.ts";
import type { KairoClientLike } from "./client.d.ts";
import type { PluginHook } from "./constants.d.ts";
import type { Awaitable } from "./utilities/utilities.d.ts";

/**
 * The lifecycle points whose hooks are awaited, so they may do asynchronous work.
 *
 * @since 1.0.0
 */
export type AsyncPluginHooks = (typeof PluginHookConstant)[
	| "PreLogin"
	| "PostLogin"];

/**
 * The lifecycle points whose hooks run inside the client's constructor and are therefore not
 * awaited.
 *
 * @since 1.0.0
 */
export type SyncPluginHooks = Exclude<PluginHook, AsyncPluginHooks>;

/**
 * A hook running at a synchronous lifecycle point. Its return value is discarded; returning a
 * promise only means nothing waits for it.
 *
 * @since 1.0.0
 */
export type PluginHookFunction = (
	this: KairoClientLike,
	options: ClientOptions,
) => unknown;

/**
 * A hook running at an asynchronous lifecycle point. Returning a promise delays the rest of the
 * start-up until it settles.
 *
 * @since 1.0.0
 */
export type PluginAsyncHookFunction = (
	this: KairoClientLike,
	options: ClientOptions,
) => Awaitable<unknown>;

/**
 * One registered hook: the function, when it runs, and the label reported alongside it.
 *
 * @since 1.0.0
 */
export interface PluginHookEntry<
	T = PluginHookFunction | PluginAsyncHookFunction,
> {
	/**
	 * The function to call.
	 */
	hook: T;

	/**
	 * The lifecycle point it was registered for.
	 */
	type: PluginHook;

	/**
	 * The label reported with the plugin-loaded event, if the hook was given one.
	 */
	name?: string;
}
