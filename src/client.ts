import { Client, type ClientOptions } from "discord.js";
import type {
	KairoClientOptions,
	Logger as LoggerContract,
	PrefixHook,
	StoreRegistry,
} from "@types";
import { container } from "@/container.ts";
import { Store } from "@/loader/store.ts";
import { Events } from "@/constants/events.ts";
import { PluginHook } from "@/constants/enums.ts";
import { LogLevel } from "@/logger/logLevel.ts";
import { Logger } from "@/logger/logger.ts";
import type { Plugin } from "@/plugin/plugin.ts";
import { PluginManager } from "@/plugin/pluginManager.ts";
import { ArgumentStore } from "@/structures/argumentStore.ts";
import { CommandStore } from "@/structures/commandStore.ts";
import { InteractionHandlerStore } from "@/structures/interactionHandlerStore.ts";
import { ListenerStore } from "@/structures/listenerStore.ts";
import { PatternCommandStore } from "@/structures/patternCommandStore.ts";
import { Utilities } from "@/structures/utilityStore.ts";
import { PreconditionStore } from "@/structures/preconditionStore.ts";
import { acquire } from "@/applicationCommands/registries.ts";
import { loadApplicationCommandRegistriesListeners } from "@/optionalListeners/applicationCommandRegistries/index.ts";
import { loadErrorListeners } from "@/optionalListeners/errors/index.ts";
import { loadMessageCommandListeners } from "@/optionalListeners/messageCommands/index.ts";
import { loadEditableCommandsListeners } from "@/editableCommands/index.ts";

// Registering the built-in pieces is a side effect of importing them, so these imports are load
// bearing even though nothing is bound from them.
import "@/arguments/index.ts";
import "@/listeners/index.ts";
import "@/preconditions/pieces/index.ts";

container.applicationCommandRegistries = { acquire };

/**
 * The Discord client, extended with Kairo's piece loader, stores and plugin lifecycle.
 *
 * Use it exactly as you would a discord.js `Client`; the difference is that constructing it wires up
 * the stores, and `login` discovers and loads every piece before connecting.
 *
 * @example
 * ```typescript
 * import { KairoClient } from "kairojs";
 * import { GatewayIntentBits } from "discord.js";
 *
 * const client = new KairoClient({
 *   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
 *   defaultPrefix: "!"
 * });
 *
 * await client.login(process.env.DISCORD_TOKEN);
 * ```
 *
 * @since 1.0.0
 */
export class KairoClient<
	Ready extends boolean = boolean,
> extends Client<Ready> {
	/**
	 * Resolves the prefix or prefixes a given message may use.
	 *
	 * Replace it to make the prefix depend on the guild, the user, or anything else — it may return a
	 * single prefix, several, or `null` to accept none.
	 *
	 * @example
	 * ```typescript
	 * client.fetchPrefix = async (message) => {
	 *   if (!message.guild) return "!";
	 *   const settings = await database.guilds.findOne(message.guild.id);
	 *   return settings?.prefix ?? "!";
	 * };
	 * ```
	 */
	public override fetchPrefix: PrefixHook;

	/**
	 * Where the framework and its plugins write diagnostics. Defaults to a console logger.
	 */
	public override logger: LoggerContract;

	/**
	 * Whether mentioning the bot is refused as a prefix.
	 *
	 * @default false
	 */
	public disableMentionPrefix?: boolean;

	/**
	 * Every store this client has registered.
	 */
	public override stores: StoreRegistry;

	/**
	 * @param options The discord.js client options, plus Kairo's own.
	 */
	public constructor(options: ClientOptions) {
		super(options);

		// Assigned first so every hook and piece that follows can reach the client through the
		// container. Nothing below this line may run before it.
		container.client = this;

		for (const plugin of KairoClient.plugins.values(
			PluginHook.PreGenericsInitialization,
		)) {
			plugin.hook.call(this, options);
			this.emit(Events.PluginLoaded, plugin.type, plugin.name);
		}

		this.logger =
			options.logger?.instance ??
			new Logger(options.logger?.level ?? LogLevel.Info);
		container.logger = this.logger;

		if (
			options.enableLoaderTraceLoggings ??
			container.logger.has(LogLevel.Trace)
		) {
			Store.logger = container.logger.trace.bind(container.logger);
		}

		this.stores = container.stores;

		this.fetchPrefix =
			options.fetchPrefix ?? (() => this.options.defaultPrefix ?? null);
		this.disableMentionPrefix = options.disableMentionPrefix;

		for (const plugin of KairoClient.plugins.values(
			PluginHook.PreInitialization,
		)) {
			plugin.hook.call(this, options);
			this.emit(Events.PluginLoaded, plugin.type, plugin.name);
		}

		this.id = options.id ?? null;

		// `new Utilities()` assigns `container.utilities` from its own constructor, so where it sits in
		// this chain does not matter.
		this.stores
			.register(new ArgumentStore())
			.register(new CommandStore())
			.register(new InteractionHandlerStore())
			.register(new ListenerStore())
			.register(new PatternCommandStore())
			.register(new PreconditionStore())
			.register(new Utilities().store);

		if (options.loadApplicationCommandRegistriesStatusListeners !== false) {
			loadApplicationCommandRegistriesListeners();
		}

		if (options.loadDefaultErrorListeners !== false) {
			loadErrorListeners();
		}

		if (options.loadMessageCommandListeners === true) {
			loadMessageCommandListeners();

			// Editing an invocation only means anything when message commands are being handled at all,
			// so this rides on the same switch rather than adding a second one nobody would find.
			loadEditableCommandsListeners();
		}

		for (const plugin of KairoClient.plugins.values(
			PluginHook.PostInitialization,
		)) {
			plugin.hook.call(this, options);
			this.emit(Events.PluginLoaded, plugin.type, plugin.name);
		}
	}

	/**
	 * Discovers and loads every piece, then connects to Discord.
	 *
	 * Pieces are loaded before the gateway connection opens, so no event can arrive before the
	 * listeners that handle it exist.
	 *
	 * @param token The bot token to log in with.
	 * @returns The token that was used.
	 */
	public override async login(token?: string) {
		// A `null` base directory means the bot registers its own paths, so skip the defaults.
		if (this.options.baseUserDirectory !== null) {
			this.stores.registerPath(this.options.baseUserDirectory);
		}

		for (const plugin of KairoClient.plugins.values(PluginHook.PreLogin)) {
			await plugin.hook.call(this, this.options);
			this.emit(Events.PluginLoaded, plugin.type, plugin.name);
		}

		await Promise.all(
			[...this.stores.values()].map((store) => store.loadAll()),
		);
		const result = await super.login(token);

		for (const plugin of KairoClient.plugins.values(PluginHook.PostLogin)) {
			await plugin.hook.call(this, this.options);
			this.emit(Events.PluginLoaded, plugin.type, plugin.name);
		}

		return result;
	}

	/**
	 * Every plugin hook registered against this client.
	 */
	public static plugins = new PluginManager();

	/**
	 * Registers a plugin's hooks. Call this before constructing the client.
	 *
	 * @param plugin The plugin class to register.
	 */
	public static use(plugin: typeof Plugin) {
		KairoClient.plugins.use(plugin);
		return KairoClient;
	}
}

declare module "discord.js" {
	interface Client {
		id: import("discord.js").Snowflake | null;
		logger: LoggerContract;
		stores: StoreRegistry;
		fetchPrefix: PrefixHook;
	}

	interface ClientOptions extends KairoClientOptions {}
}
