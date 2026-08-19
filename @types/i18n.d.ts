import type {
	BaseInteraction,
	Guild,
	Interaction,
	LocalizationMap,
	Message,
	StageChannel,
	User,
	VoiceChannel,
} from "discord.js";
import type { InitOptions, TFunctionDetailedResult, TOptions } from "i18next";
import type { PathLike } from "./loader.d.ts";
import type { Awaitable } from "./utilities/utilities.d.ts";

export type { TFunction, TOptions } from "i18next";

/**
 * What a translation lookup actually returns once a default value is taken into account.
 *
 * A key that resolves normally keeps its own type; one that does not falls back to the type of the
 * default value that was supplied, if any.
 *
 * `i18next` computes this internally but does not export it, so it is restated here rather than
 * imported.
 *
 * @since 1.0.0
 */
export type I18nextReturnValue<Ret, DefaultValue> = Ret extends
	| string
	| $SpecialObject
	| null
	? Ret
	: [DefaultValue] extends [never]
		? Ret
		: DefaultValue;

/**
 * Wraps a translation result in `i18next`'s detail envelope when `returnDetails` was requested, and
 * leaves it alone otherwise.
 *
 * `i18next` computes this internally but does not export it, so it is restated here rather than
 * imported.
 *
 * @since 1.0.0
 */
export type I18nextOptionalDetails<
	Ret,
	TOpt extends TOptions,
> = TOpt["returnDetails"] extends true
	? TFunctionDetailedResult<Ret, TOpt>
	: Ret;

/**
 * Marks a type parameter as non-inferrable, so a call site has to spell the type out rather than
 * having it widened from an argument.
 *
 * It exists purely so the i18n surface can keep the name `i18next` itself publishes; the
 * implementation is TypeScript's own `NoInfer`.
 *
 * @since 1.0.0
 */
export type $NoInfer<A> = NoInfer<A>;

/**
 * An arbitrary bag of interpolation values, mirroring the shape `i18next` accepts for replacements.
 *
 * @since 1.0.0
 */
export interface $Dictionary {
	[key: string]: any;
}

/**
 * What a translation resolves to when `returnObjects` is enabled: the raw JSON subtree rather than a
 * formatted string.
 *
 * @since 1.0.0
 */
export type $SpecialObject = $Dictionary | Array<string | $Dictionary>;

/**
 * The knobs handed straight to the file-system watcher that drives language hot reloading.
 *
 * Recursion is always on — a languages folder is a tree by definition — so it is deliberately not
 * configurable here.
 *
 * @since 1.0.0
 */
export interface I18nWatchOptions {
	/**
	 * Whether the watcher keeps the process alive on its own.
	 *
	 * @default true
	 */
	persistent?: boolean;

	/**
	 * A signal that closes the watcher when aborted.
	 */
	signal?: AbortSignal;
}

/**
 * Controls whether translations are re-read from disk while the bot is running.
 *
 * Setting `enabled` is the whole minimum configuration; everything else narrows what gets reloaded
 * or tunes the watcher itself.
 *
 * @since 1.0.0
 */
export interface I18nHMROptions {
	/**
	 * Whether the languages directory is watched at all.
	 *
	 * @default false
	 */
	enabled: boolean;

	/**
	 * The languages reloaded when the directory changes.
	 *
	 * @default every language discovered in the languages directory
	 */
	languages?: string | string[];

	/**
	 * The namespaces reloaded when the directory changes.
	 *
	 * @default every namespace discovered in the languages directory
	 */
	namespaces?: string | string[];

	/**
	 * Options passed through to the watcher.
	 */
	options?: I18nWatchOptions;
}

/**
 * Where a single translation file lives.
 *
 * A plain path may contain the `{{lng}}` and `{{ns}}` placeholders, which are substituted with the
 * language and namespace being loaded. Pass a function instead when the layout is not expressible as
 * a template.
 *
 * @since 1.0.0
 */
export type LanguagePathResolvable =
	| PathLike
	| ((language: string, namespace: string) => PathLike);

/**
 * The options the built-in file-system backend reads translations with.
 *
 * When more than one path is registered, every one of them is read and the results are merged, later
 * paths winning — which is how a bot overrides individual keys of a shared translation set.
 *
 * @since 1.0.0
 */
export interface I18nextBackendOptions {
	/**
	 * The paths a namespace is looked for under, in order.
	 */
	paths?: readonly LanguagePathResolvable[];
}

/**
 * Builds the `i18next` options once the languages and namespaces on disk are known, for the cases
 * where the configuration depends on what was actually found.
 *
 * @since 1.0.0
 */
export type DynamicOptions<T extends InitOptions> = (
	namespaces: string[],
	languages: string[],
) => T;

/**
 * Everything the internationalisation handler can be configured with, passed as the client's `i18n`
 * option.
 *
 * @since 1.0.0
 */
export interface InternationalizationOptions {
	/**
	 * The locale used when nothing else resolves, just before falling back to `"en-US"`.
	 *
	 * @since 1.0.0
	 */
	defaultName?: string;

	/**
	 * Extra options for the file-system backend, most usefully additional lookup paths.
	 *
	 * @since 1.0.0
	 */
	backend?: I18nextBackendOptions;

	/**
	 * The options `i18next` itself is initialised with, or a function that produces them from the
	 * languages and namespaces that were discovered.
	 *
	 * @since 1.0.0
	 */
	i18next?: InitOptions | DynamicOptions<InitOptions>;

	/**
	 * The directory translations are read from.
	 *
	 * @default `<baseUserDirectory>/languages`
	 * @since 1.0.0
	 */
	defaultLanguageDirectory?: string;

	/**
	 * The key looked up when the requested one is missing, so an absent translation produces a
	 * readable message rather than the raw key.
	 *
	 * @since 1.0.0
	 */
	defaultMissingKey?: string;

	/**
	 * The namespace prefixed to keys that do not name one.
	 *
	 * @default "default"
	 * @since 1.0.0
	 */
	defaultNS?: string;

	/**
	 * Custom formatters registered with `i18next` once it is initialised.
	 *
	 * @default []
	 * @since 1.0.0
	 */
	formatters?: I18nextFormatter[];

	/**
	 * Whether translations are re-read from disk when the languages directory changes.
	 *
	 * @since 1.0.0
	 */
	hmr?: I18nHMROptions;

	/**
	 * Resolves the language for a given guild, channel and user, which is what makes per-guild or
	 * per-user localisation possible. Returning a nullish value falls through to the defaults.
	 *
	 * @default () => InternationalizationOptions.defaultName
	 * @since 1.0.0
	 */
	fetchLanguage?: (
		context: InternationalizationContext,
	) => Awaitable<string | null>;
}

/**
 * Any channel a message can be read from.
 *
 * @since 1.0.0
 */
export type TextBasedDiscordChannel = Message["channel"];

/**
 * Any channel a language may be resolved for.
 *
 * @since 1.0.0
 */
export type DiscordChannel =
	| TextBasedDiscordChannel
	| StageChannel
	| VoiceChannel;

/**
 * What a `fetchLanguage` implementation is told about the place a translation was asked for.
 *
 * Each field is independently nullable: a direct message has no guild, a guild-wide lookup has no
 * user, and so on.
 *
 * @since 1.0.0
 */
export interface InternationalizationContext {
	/**
	 * The guild the language is being resolved for, or `null` in a direct message.
	 */
	guild: Guild | null;

	/**
	 * The channel the language is being resolved for.
	 */
	channel: DiscordChannel | null;

	/**
	 * The user the language is being resolved for.
	 */
	user: User | null;

	/**
	 * The guild locale Discord reported on the originating interaction, if there was one.
	 */
	interactionGuildLocale?: Interaction["guildLocale"];

	/**
	 * The user locale Discord reported on the originating interaction, if there was one.
	 */
	interactionLocale?: Interaction["locale"];
}

/**
 * The client option this module contributes.
 *
 * @since 1.0.0
 */
export interface InternationalizationClientOptions {
	/**
	 * How internationalisation is configured for this bot.
	 */
	i18n?: InternationalizationOptions;
}

/**
 * A custom `i18next` formatter, in either of the two shapes `i18next` accepts.
 *
 * @see {@link https://www.i18next.com/translation-function/formatting#adding-custom-format-function}
 * @since 1.0.0
 */
export type I18nextFormatter =
	| I18nextNamedFormatter
	| I18nextNamedCachedFormatter;

/**
 * A formatter invoked afresh for every value it formats.
 *
 * @see {@link https://www.i18next.com/translation-function/formatting#adding-custom-format-function}
 * @since 1.0.0
 */
export interface I18nextNamedFormatter {
	/**
	 * Distinguishes this shape from the cached one.
	 */
	cached?: false;

	/**
	 * The name the formatter is referenced by inside a translation.
	 */
	name: string;

	/**
	 * Formats a single value.
	 */
	format(value: any, lng: string | undefined, options: any): string;
}

/**
 * A formatter that is built once per language and options pair, then reused for every value — worth
 * it when the setup work, such as constructing an `Intl` formatter, is expensive.
 *
 * @see {@link https://www.i18next.com/translation-function/formatting#adding-custom-format-function}
 * @since 1.0.0
 */
export interface I18nextNamedCachedFormatter {
	/**
	 * Distinguishes this shape from the uncached one.
	 */
	cached: true;

	/**
	 * The name the formatter is referenced by inside a translation.
	 */
	name: string;

	/**
	 * Builds the formatter for a language and set of options.
	 */
	format(lng: string | undefined, options: any): (value: any) => string;
}

/**
 * A translated string together with the same string in every other loaded language, in the shape
 * Discord's application command endpoints expect.
 *
 * @since 1.0.0
 */
export interface LocalizedData {
	/**
	 * The value in the default language.
	 */
	value: string;

	/**
	 * The value in every other loaded language, keyed by locale.
	 */
	localizations: LocalizationMap;
}

/**
 * The part of a builder that carries a localisable name — matched structurally so command, option
 * and subcommand builders all qualify.
 *
 * @since 1.0.0
 */
export interface BuilderWithName {
	setName(name: string): this;
	setNameLocalizations(localizedNames: LocalizationMap | null): this;
}

/**
 * The part of a builder that carries a localisable description.
 *
 * @since 1.0.0
 */
export interface BuilderWithDescription {
	setDescription(description: string): this;
	setDescriptionLocalizations(
		localizedDescriptions: LocalizationMap | null,
	): this;
}

/**
 * A builder carrying both a localisable name and description.
 *
 * @since 1.0.0
 */
export type BuilderWithNameAndDescription = BuilderWithName &
	BuilderWithDescription;

/**
 * Anything a message-shaped language lookup can start from.
 *
 * @since 1.0.0
 */
export type ChannelTarget = Message | DiscordChannel;

/**
 * Anything a language can be resolved for.
 *
 * @since 1.0.0
 */
export type Target = BaseInteraction | ChannelTarget | Guild;

declare module "discord.js" {
	interface ClientOptions extends InternationalizationClientOptions {}
}

declare module "./loader.d.ts" {
	interface Container {
		/**
		 * The internationalisation handler, created as soon as the client exists and populated once
		 * translations have been read from disk.
		 */
		i18n: import("@/i18n/lib/handler.ts").InternationalizationHandler;
	}
}
