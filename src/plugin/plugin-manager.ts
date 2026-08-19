// `PluginHook` is both a frozen const object (the value, below) and the union of its members (the
// type). Alias the type on import so the two names do not collide in this file.
import type {
	AsyncPluginHooks,
	PluginAsyncHookFunction,
	PluginHookEntry,
	PluginHookFunction,
	PluginHook as PluginHookType,
	SyncPluginHooks,
} from "@types";
import { PluginHook } from "@/constants/enums.ts";
import type { Plugin } from "./plugin.ts";
import {
	postInitialization,
	postLogin,
	preGenericsInitialization,
	preInitialization,
	preLogin,
} from "./symbols.ts";

/**
 * Every hook symbol paired with the lifecycle point it corresponds to, in the order they run.
 */
const HookSymbols: readonly (readonly [symbol, PluginHookType])[] = [
	[preGenericsInitialization, PluginHook.PreGenericsInitialization],
	[preInitialization, PluginHook.PreInitialization],
	[postInitialization, PluginHook.PostInitialization],
	[preLogin, PluginHook.PreLogin],
	[postLogin, PluginHook.PostLogin],
];

/**
 * Holds every hook registered against the client and hands them back, in registration order, at each
 * point of the start-up sequence.
 *
 * Hooks can be registered either by handing a {@link Plugin} subclass to {@link PluginManager.use},
 * or individually through the `register*Hook` methods when there is no class to hang them off.
 *
 * @since 1.0.0
 */
export class PluginManager {
	/**
	 * Every registered hook, in the order it was registered.
	 */
	public readonly registry = new Set<PluginHookEntry>();

	/**
	 * Registers a single hook at the given lifecycle point.
	 *
	 * @param hook The function to call.
	 * @param type When to call it.
	 * @param name An optional label, reported with the plugin-loaded event.
	 * @throws {TypeError} If `hook` is not a function.
	 */
	public registerHook(
		hook: PluginHookFunction,
		type: SyncPluginHooks,
		name?: string,
	): this;
	public registerHook(
		hook: PluginAsyncHookFunction,
		type: AsyncPluginHooks,
		name?: string,
	): this;
	public registerHook(
		hook: PluginHookFunction | PluginAsyncHookFunction,
		type: PluginHookType,
		name?: string,
	): this {
		if (typeof hook !== "function") {
			throw new TypeError(
				`The provided hook ${name ? `(${name}) ` : ""}is not a function`,
			);
		}

		this.registry.add({ hook, type, name });
		return this;
	}

	/**
	 * Registers a hook to run before the client has touched any of its own options.
	 */
	public registerPreGenericsInitializationHook(
		hook: PluginHookFunction,
		name?: string,
	) {
		return this.registerHook(hook, PluginHook.PreGenericsInitialization, name);
	}

	/**
	 * Registers a hook to run once the logger exists but before the stores are registered.
	 */
	public registerPreInitializationHook(
		hook: PluginHookFunction,
		name?: string,
	) {
		return this.registerHook(hook, PluginHook.PreInitialization, name);
	}

	/**
	 * Registers a hook to run once every built-in store is registered.
	 */
	public registerPostInitializationHook(
		hook: PluginHookFunction,
		name?: string,
	) {
		return this.registerHook(hook, PluginHook.PostInitialization, name);
	}

	/**
	 * Registers a hook to run before any piece is loaded or the gateway is reached.
	 */
	public registerPreLoginHook(hook: PluginAsyncHookFunction, name?: string) {
		return this.registerHook(hook, PluginHook.PreLogin, name);
	}

	/**
	 * Registers a hook to run once the client is connected to the gateway.
	 */
	public registerPostLoginHook(hook: PluginAsyncHookFunction, name?: string) {
		return this.registerHook(hook, PluginHook.PostLogin, name);
	}

	/**
	 * Registers every hook a plugin class declares, skipping the ones it left out.
	 *
	 * @param plugin The plugin class to read hooks from.
	 */
	public use(plugin: typeof Plugin) {
		for (const [symbol, type] of HookSymbols) {
			const hook = Reflect.get(plugin, symbol) as
				| PluginHookFunction
				| PluginAsyncHookFunction
				| undefined;
			if (typeof hook !== "function") continue;

			this.registerHook(hook, type as SyncPluginHooks);
		}

		return this;
	}

	/**
	 * Yields registered hooks in registration order, optionally narrowed to one lifecycle point.
	 *
	 * @param hook The lifecycle point to filter by, or omitted for every hook.
	 */
	public values(): Generator<PluginHookEntry, void, unknown>;
	public values(
		hook: SyncPluginHooks,
	): Generator<PluginHookEntry<PluginHookFunction>, void, unknown>;
	public values(
		hook: AsyncPluginHooks,
	): Generator<PluginHookEntry<PluginAsyncHookFunction>, void, unknown>;
	public *values(
		hook?: PluginHookType,
	): Generator<PluginHookEntry, void, unknown> {
		for (const entry of this.registry) {
			if (hook && entry.type !== hook) continue;
			yield entry;
		}
	}
}
