import { join, relative } from "node:path";
import i18next, {
	type DefaultNamespace,
	type InterpolationMap,
	type Namespace,
	type ParseKeys,
	type TFunction,
	type TFunctionReturn,
	type TOptions,
} from "i18next";
import type {
	$Dictionary,
	$NoInfer,
	$SpecialObject,
	Awaitable,
	I18nextBackendOptions,
	I18nextOptionalDetails,
	I18nextReturnValue,
	InternationalizationContext,
	InternationalizationOptions,
	LanguagePathResolvable,
	PathLike,
} from "@types";
import { walkFilesEndingWith } from "@utilities/fs/index.ts";
import { Result } from "@utilities/result/index.ts";
import { container } from "@/container.ts";
import { getRootData } from "@/loader/root.ts";
import { I18nextFilesystemBackend } from "./backend.ts";

/**
 * Discovers the translations on disk, hands them to `i18next`, and exposes the result to the rest of
 * the bot.
 *
 * The layout it expects is a directory per language holding a JSON file per namespace, nested as
 * deeply as you like — `languages/en-US/commands/names.json` is the namespace `commands/names` in
 * `en-US`. Nothing has to be listed anywhere: the directory itself is the manifest, and both the
 * language list and the namespace list are read from it at start-up.
 *
 * One instance lives on `container.i18n`, which is what {@link fetchT} and {@link resolveKey} reach
 * through.
 *
 * @since 1.0.0
 */
export class InternationalizationHandler {
	/**
	 * Whether {@link InternationalizationHandler.init} has run and {@link InternationalizationHandler.languages}
	 * is populated.
	 *
	 * @since 1.0.0
	 */
	public languagesLoaded = false;

	/**
	 * Every namespace found in the languages directory at start-up.
	 *
	 * @since 1.0.0
	 */
	public namespaces = new Set<string>();

	/**
	 * The translation function for each loaded language, keyed by locale.
	 *
	 * @since 1.0.0
	 */
	public readonly languages = new Map<string, TFunction>();

	/**
	 * The options this handler was constructed with.
	 *
	 * @since 1.0.0
	 */
	public readonly options: InternationalizationOptions;

	/**
	 * The directory translations are read from, and the directory watched when hot reloading is on.
	 *
	 * @since 1.0.0
	 */
	public readonly languagesDirectory: string;

	/**
	 * The lookup paths handed to the file-system backend.
	 *
	 * @since 1.0.0
	 */
	protected readonly backendOptions: I18nextBackendOptions;

	/**
	 * @param options How `i18next`, the backend and this handler should be configured.
	 */
	public constructor(options?: InternationalizationOptions) {
		this.options = options ?? { i18next: { ignoreJSONStructure: false } };

		const baseUserDirectory = container.client?.options?.baseUserDirectory;
		const resolvedBaseDirectory =
			baseUserDirectory instanceof URL
				? Bun.fileURLToPath(baseUserDirectory)
				: baseUserDirectory;

		this.languagesDirectory =
			this.options.defaultLanguageDirectory ??
			join(resolvedBaseDirectory ?? getRootData().root, "languages");

		// The conventional layout is always searched, with any path the bot adds searched after it.
		const paths = new Set<LanguagePathResolvable>([
			join(this.languagesDirectory, "{{lng}}", "{{ns}}.json"),
			...(this.options.backend?.paths ?? []),
		]);

		this.backendOptions = { ...this.options.backend, paths: [...paths] };

		if (typeof this.options.fetchLanguage === "function") {
			this.fetchLanguage = this.options.fetchLanguage;
		}
	}

	/**
	 * Resolves the language to use for a given guild, channel and user.
	 *
	 * Replace it — or set the `fetchLanguage` option, which assigns it for you — to make the bot
	 * speak whatever language each guild or user configured. Returning a nullish value falls back to
	 * the guild's own preferred locale, then to `defaultName`, then to `"en-US"`.
	 *
	 * @since 1.0.0
	 * @returns The locale to use, or `null` to fall through to the defaults.
	 *
	 * @example
	 * ```typescript
	 * // Read the language out of your own database.
	 * container.i18n.fetchLanguage = async (context) => {
	 *   if (!context.guild) return null;
	 *   const settings = await database.guilds.findOne(context.guild.id);
	 *   return settings?.language ?? null;
	 * };
	 * ```
	 */
	public fetchLanguage: (
		context: InternationalizationContext,
	) => Awaitable<string | null> = () => null;

	/**
	 * Scans the languages directory, initialises `i18next` with what it found, and registers any
	 * custom formatters.
	 *
	 * Discovery happens first so that the namespace and language lists handed to `i18next` describe
	 * what actually exists — which is also what makes the `i18next` option able to be a function of
	 * those two lists.
	 *
	 * @since 1.0.0
	 */
	public async init() {
		const { namespaces, languages } = await this.walkRootDirectory(
			this.languagesDirectory,
		);

		const userOptions =
			typeof this.options.i18next === "function"
				? this.options.i18next(namespaces, languages)
				: this.options.i18next;
		const ignoreJSONStructure = userOptions?.ignoreJSONStructure ?? false;
		const skipOnVariables =
			userOptions?.interpolation?.skipOnVariables ?? false;

		i18next.use(I18nextFilesystemBackend);
		await i18next.init({
			backend: this.backendOptions,
			fallbackLng: this.options.defaultName ?? "en-US",
			interpolation: {
				escapeValue: false,
				...userOptions?.interpolation,
				skipOnVariables,
			},
			load: "all",
			defaultNS: this.options.defaultNS ?? "default",
			ns: namespaces,
			preload: languages,
			...userOptions,
			ignoreJSONStructure,
		});

		this.namespaces = new Set(namespaces);
		for (const language of languages) {
			this.languages.set(language, i18next.getFixedT(language));
		}

		this.languagesLoaded = true;

		const formatter = i18next.services.formatter!;
		for (const { name, format, cached } of this.options.formatters ?? []) {
			if (cached) formatter.addCached(name, format);
			else formatter.add(name, format);
		}
	}

	/**
	 * Returns the raw translation function for a locale.
	 *
	 * @param locale The locale to look up.
	 * @throws {Error} If translations have not been loaded yet.
	 * @throws {ReferenceError} If no such locale was loaded.
	 *
	 * @since 1.0.0
	 */
	public getT(locale: string) {
		if (!this.languagesLoaded)
			throw new Error(
				"Translations cannot be used until 'InternationalizationHandler#init' has been called.",
			);

		const translate = this.languages.get(locale);
		if (translate) return translate;

		throw new ReferenceError(`The locale '${locale}' was not loaded.`);
	}

	/**
	 * Translates one or more keys in a given locale.
	 *
	 * @param locale The locale to translate in.
	 * @param key The key, or the keys to try in order.
	 * @param options The interpolation options.
	 * @see {@link https://www.i18next.com/overview/api#t}
	 * @returns The translated content.
	 *
	 * @since 1.0.0
	 */
	public format<
		const Key extends ParseKeys<Ns, TOpt, undefined>,
		const TOpt extends TOptions = TOptions,
		Ns extends Namespace = DefaultNamespace,
		Ret extends TFunctionReturn<
			Ns,
			Key,
			TOpt
		> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
		const ActualOptions extends TOpt & InterpolationMap<Ret> = TOpt &
			InterpolationMap<Ret>,
	>(
		locale: string,
		key: Key | Key[],
		options?: ActualOptions,
	): I18nextOptionalDetails<Ret, TOpt>;

	/**
	 * Translates one or more keys in a given locale.
	 *
	 * @param locale The locale to translate in.
	 * @param key The key, or the keys to try in order.
	 * @param options The interpolation options, including the `defaultValue` used when the key is
	 * missing.
	 * @see {@link https://www.i18next.com/overview/api#t}
	 * @returns The translated content.
	 *
	 * @since 1.0.0
	 */
	public format<
		const Key extends ParseKeys<Ns, TOpt, undefined>,
		const TOpt extends TOptions = TOptions,
		Ns extends Namespace = DefaultNamespace,
		Ret extends TFunctionReturn<
			Ns,
			Key,
			TOpt
		> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	>(
		locale: string,
		key: string | string[],
		options: TOpt & $Dictionary & { defaultValue: string },
	): I18nextOptionalDetails<Ret, TOpt>;

	/**
	 * Translates one or more keys in a given locale.
	 *
	 * @param locale The locale to translate in.
	 * @param key The key, or the keys to try in order.
	 * @param defaultValue The value used when the key is missing.
	 * @param options The interpolation options.
	 * @see {@link https://www.i18next.com/overview/api#t}
	 * @returns The translated content.
	 *
	 * @since 1.0.0
	 */
	public format<
		const Key extends ParseKeys<Ns, TOpt, undefined>,
		const TOpt extends TOptions = TOptions,
		Ns extends Namespace = DefaultNamespace,
		Ret extends TFunctionReturn<
			Ns,
			Key,
			TOpt
		> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	>(
		locale: string,
		key: string | string[],
		defaultValue: string | undefined,
		options?: TOpt & $Dictionary,
	): I18nextOptionalDetails<Ret, TOpt>;

	/**
	 * Translates one or more keys in a given locale.
	 *
	 * @param locale The locale to translate in.
	 *
	 * @remarks The key, default value and options are documented on the overloads above; a single
	 * implementation signature cannot describe all three call shapes at once.
	 *
	 * @see {@link https://www.i18next.com/overview/api#t}
	 * @returns The translated content.
	 *
	 * @since 1.0.0
	 */
	public format<
		const Key extends ParseKeys<Ns, TOpt, undefined>,
		const TOpt extends TOptions = TOptions,
		Ns extends Namespace = DefaultNamespace,
		Ret extends TFunctionReturn<
			Ns,
			Key,
			TOpt
		> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
		const ActualOptions extends TOpt & InterpolationMap<Ret> = TOpt &
			InterpolationMap<Ret>,
		DefaultValue extends string = never,
	>(
		locale: string,
		...[key, defaultValueOrOptions, optionsOrUndefined]:
			| [key: Key | Key[], options?: ActualOptions]
			| [
					key: string | string[],
					options: TOpt & $Dictionary & { defaultValue: string },
			  ]
			| [
					key: string | string[],
					defaultValue: DefaultValue | undefined,
					options?: TOpt & $Dictionary,
			  ]
	): I18nextOptionalDetails<
		I18nextReturnValue<$NoInfer<Ret>, DefaultValue>,
		TOpt
	> {
		if (!this.languagesLoaded)
			throw new Error(
				"Translations cannot be used until 'InternationalizationHandler#init' has been called.",
			);

		const translate = this.languages.get(locale);
		if (!translate)
			throw new ReferenceError(`The locale '${locale}' was not loaded.`);

		// A missing key falls back to the caller's default value, then to the configured
		// `defaultMissingKey` translation, and finally to an empty string.
		const defaultValue =
			typeof defaultValueOrOptions === "string"
				? defaultValueOrOptions
				: this.options.defaultMissingKey
					? translate(this.options.defaultMissingKey, { replace: { key } })
					: "";

		return translate(
			key as never,
			{
				defaultValue,
				...((optionsOrUndefined ?? {}) as TOpt),
			} as never,
		) as I18nextOptionalDetails<
			I18nextReturnValue<$NoInfer<Ret>, DefaultValue>,
			TOpt
		>;
	}

	/**
	 * Scans a languages directory and reports the languages and namespaces it contains.
	 *
	 * The top level of the directory is the language list; everything below a language is its
	 * namespaces, with nested folders joined by `/` exactly as `i18next` addresses them. Walking is
	 * done by Kairo's shared file walker, so it behaves the same as piece discovery.
	 *
	 * @param directory The languages directory to scan.
	 * @returns The namespaces and languages found.
	 *
	 * @since 1.0.0
	 */
	public async walkRootDirectory(directory: PathLike) {
		const root =
			typeof directory === "string" ? directory : Bun.fileURLToPath(directory);

		const languages = new Set<string>();
		const namespaces = new Set<string>();

		for await (const file of walkFilesEndingWith(root, ".json")) {
			const segments = relative(root, file).split(/[\\/]/);

			// A JSON file sitting directly in the languages directory belongs to no language, so it
			// names neither a language nor a namespace.
			if (segments.length < 2) continue;

			languages.add(segments[0]!);
			namespaces.add(segments.slice(1).join("/").slice(0, -".json".length));
		}

		return { namespaces: [...namespaces], languages: [...languages] };
	}

	/**
	 * Re-reads translations from disk without restarting the bot.
	 *
	 * By default everything currently on disk is reloaded; narrowing it through the `hmr` options is
	 * worth it only for very large translation sets. Failures are logged rather than thrown, since
	 * this runs from a file-system watcher with no caller to hand an error back to.
	 *
	 * @since 1.0.0
	 */
	public async reloadResources() {
		const outcome = await Result.fromAsync(async () => {
			let languages = this.options.hmr?.languages;
			let namespaces = this.options.hmr?.namespaces;

			if (!languages || !namespaces) {
				const found = await this.walkRootDirectory(this.languagesDirectory);
				languages ??= found.languages;
				namespaces ??= found.namespaces;
			}

			await i18next.reloadResources(languages, namespaces);
			container.logger.info("[i18n]: Reloaded language resources.");
		});

		outcome.inspectErr((error) =>
			container.logger.error(
				"[i18n]: Failed to reload language resources.",
				error,
			),
		);
	}
}
