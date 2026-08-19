// `fs.watch` is the one file-system API Bun offers no native replacement for, so it is imported from
// `node:fs` on purpose — the single, deliberate exception to Kairo's ban on that module.
import { watch } from "node:fs";
import type { ClientOptions } from "discord.js";
import type { KairoClientLike } from "@types";
import { debounce } from "@utilities/utilities/index.ts";
import { container } from "@/container.ts";
import { Plugin } from "@/plugin/plugin.ts";
import {
	postLogin,
	preGenericsInitialization,
	preLogin,
} from "@/plugin/symbols.ts";
import { InternationalizationHandler } from "./handler.ts";

/**
 * Puts the internationalisation handler on the container.
 *
 * This has to happen before anything else touches `container.i18n`, and it can only happen once
 * `container.client` exists, because the handler reads `baseUserDirectory` off the client to work
 * out where the languages directory is.
 *
 * @param options The client options, whose `i18n` property configures the handler.
 *
 * @since 1.0.0
 */
export function createInternationalizationHandler(options: ClientOptions) {
	container.i18n = new InternationalizationHandler(options.i18n);
}

/**
 * Reads every translation off disk and initialises `i18next`.
 *
 * Deliberately separate from creating the handler: the handler must exist early so anything can
 * reference it, but reading the file system is slow and only has to finish before the bot starts
 * answering anyone.
 *
 * @since 1.0.0
 */
export function initializeInternationalization() {
	return container.i18n.init();
}

/**
 * Watches the languages directory and re-reads translations whenever it changes.
 *
 * Editing a translation is the one change a running bot can absorb without reloading any code, which
 * is what makes this worth having separately from piece-level hot reloading.
 *
 * @param options The client options, whose `i18n.hmr` property configures the watcher.
 * @returns The watcher, or `null` when hot reloading is off.
 *
 * @since 1.0.0
 */
export function watchLanguagesDirectory(options: ClientOptions) {
	const hmr = options.i18n?.hmr;
	if (!hmr?.enabled) return null;

	container.logger.info(
		"[i18n]: Hot reloading enabled. Watching the languages directory for changes.",
	);

	// Saving one file produces several events, and a directory-wide change produces one per file, so
	// the reload is debounced into a single pass over everything that settled.
	const reload = debounce(() => void container.i18n.reloadResources(), {
		wait: 100,
	});

	// Every event type matters here: a translation may be edited in place, added, removed or moved,
	// and all of them change what should be loaded.
	return watch(
		container.i18n.languagesDirectory,
		{ ...hmr.options, recursive: true },
		() => reload(),
	);
}

/**
 * Wires internationalisation into the client's lifecycle.
 *
 * Translations are opt-in — `i18next` is an optional peer dependency and nothing outside this module
 * imports it — so this keeps the plugin shape rather than being built into the client: register it
 * and the three phases below run in order, ignore it and the framework never loads `i18next` at all.
 *
 * @example
 * ```typescript
 * import { KairoClient } from "kairojs";
 * import { I18nPlugin } from "kairojs/i18n";
 *
 * KairoClient.use(I18nPlugin);
 *
 * const client = new KairoClient({ intents: [], i18n: { defaultName: "en-US" } });
 * ```
 *
 * @since 1.0.0
 */
export class I18nPlugin extends Plugin {
	/**
	 * Creates the handler as early as the client allows, so every later hook and every piece can
	 * reach `container.i18n`.
	 */
	public static override [preGenericsInitialization](
		this: KairoClientLike,
		options: ClientOptions,
	): void {
		createInternationalizationHandler(options);
	}

	/**
	 * Loads the translations before the gateway connection opens, so no command can be answered in
	 * the wrong language — or fail outright — because translations were still loading.
	 */
	public static override [preLogin](this: KairoClientLike): Promise<void> {
		return initializeInternationalization();
	}

	/**
	 * Starts watching the languages directory once the bot is up.
	 */
	public static override [postLogin](
		this: KairoClientLike,
		options: ClientOptions,
	): void {
		watchLanguagesDirectory(options);
	}
}
