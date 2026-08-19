import {
	BaseInteraction,
	ChannelType,
	Guild,
	Locale,
	Message,
	type APIApplicationCommandOptionChoice,
	type LocaleString,
} from "discord.js";
import type {
	DefaultNamespace,
	InterpolationMap,
	Namespace,
	ParseKeys,
	TFunctionReturn,
	TOptions,
} from "i18next";
import type {
	$Dictionary,
	$SpecialObject,
	BuilderWithDescription,
	BuilderWithName,
	BuilderWithNameAndDescription,
	I18nextOptionalDetails,
	InternationalizationContext,
	LocalizedData,
	Target,
} from "@types";
import { lazy } from "@utilities/utilities/index.ts";
import { container } from "@/container.ts";

/**
 * Works out which language to speak to a given target in.
 *
 * The target is unwrapped into the guild, channel and user it implies, and those are handed to
 * {@link InternationalizationHandler.fetchLanguage}. When that yields nothing the fallbacks run in
 * order: the guild's own preferred locale, then the configured `defaultName`, then `"en-US"`.
 *
 * @param target Anything a language can be resolved for.
 * @returns The locale to use.
 *
 * @since 1.0.0
 */
export function fetchLanguage(target: Target): Promise<string> {
	if (target instanceof BaseInteraction) {
		return resolveLanguage({
			user: target.user,
			channel: target.channel,
			guild: target.guild,
			interactionGuildLocale: target.guildLocale,
			interactionLocale: target.locale,
		});
	}

	if (target instanceof Message) {
		return resolveLanguage({
			user: target.author,
			channel: target.channel,
			guild: target.guild,
		});
	}

	if (target instanceof Guild) {
		return resolveLanguage({ user: null, channel: null, guild: target });
	}

	// A direct message has no guild to inherit a locale from.
	if (target.type === ChannelType.DM || target.type === ChannelType.GroupDM) {
		return resolveLanguage({ user: null, channel: target, guild: null });
	}

	return resolveLanguage({ user: null, channel: target, guild: target.guild });
}

/**
 * Returns the translation function for whichever language a target should be addressed in.
 *
 * Reach for this when a command translates several keys in a row: resolving the language once and
 * reusing the function is cheaper, and guarantees every string comes from the same locale.
 *
 * @param target Anything a language can be resolved for.
 * @returns The translation function for that target's language.
 *
 * @since 1.0.0
 */
export async function fetchT(target: Target) {
	return container.i18n.getT(await fetchLanguage(target));
}

/**
 * Translates a key in whichever language a target should be addressed in.
 *
 * @param target Anything a language can be resolved for.
 * @param key The key, or the keys to try in order.
 * @param options The interpolation options.
 * @returns The translated content.
 *
 * @since 1.0.0
 */
export async function resolveKey<
	const Key extends ParseKeys<Ns, TOpt, undefined>,
	const TOpt extends TOptions = TOptions,
	Ret extends TFunctionReturn<
		Ns,
		Key,
		TOpt
	> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	Ns extends Namespace = DefaultNamespace,
	const ActualOptions extends TOpt & InterpolationMap<Ret> = TOpt &
		InterpolationMap<Ret>,
>(
	target: Target,
	key: Key | Key[],
	options?: ActualOptions,
): Promise<I18nextOptionalDetails<Ret, TOpt>>;

/**
 * Translates a key in whichever language a target should be addressed in.
 *
 * @param target Anything a language can be resolved for.
 * @param key The key, or the keys to try in order.
 * @param options The interpolation options, including the `defaultValue` used when the key is
 * missing.
 * @returns The translated content.
 *
 * @since 1.0.0
 */
export async function resolveKey<
	const Key extends ParseKeys<Ns, TOpt, undefined>,
	const TOpt extends TOptions = TOptions,
	Ret extends TFunctionReturn<
		Ns,
		Key,
		TOpt
	> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	Ns extends Namespace = DefaultNamespace,
>(
	target: Target,
	key: string | string[],
	options: TOpt & $Dictionary & { defaultValue: string },
): Promise<I18nextOptionalDetails<Ret, TOpt>>;

/**
 * Translates a key in whichever language a target should be addressed in.
 *
 * @param target Anything a language can be resolved for.
 * @param key The key, or the keys to try in order.
 * @param defaultValue The value used when the key is missing.
 * @param options The interpolation options.
 * @returns The translated content.
 *
 * @since 1.0.0
 */
export async function resolveKey<
	const Key extends ParseKeys<Ns, TOpt, undefined>,
	const TOpt extends TOptions = TOptions,
	Ret extends TFunctionReturn<
		Ns,
		Key,
		TOpt
	> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	Ns extends Namespace = DefaultNamespace,
>(
	target: Target,
	key: string | string[],
	defaultValue: string,
	options?: TOpt & $Dictionary,
): Promise<I18nextOptionalDetails<Ret, TOpt>>;

/**
 * Translates a key in whichever language a target should be addressed in.
 *
 * @param target Anything a language can be resolved for.
 *
 * @remarks The key, default value and options are documented on the overloads above; a single
 * implementation signature cannot describe all three call shapes at once.
 *
 * @returns The translated content.
 *
 * @since 1.0.0
 */
export async function resolveKey<
	const Key extends ParseKeys<Ns, TOpt, undefined>,
	const TOpt extends TOptions = TOptions,
	Ret extends TFunctionReturn<
		Ns,
		Key,
		TOpt
	> = TOpt["returnObjects"] extends true ? $SpecialObject : string,
	Ns extends Namespace = DefaultNamespace,
	const ActualOptions extends TOpt & InterpolationMap<Ret> = TOpt &
		InterpolationMap<Ret>,
>(
	target: Target,
	...[key, defaultValueOrOptions, optionsOrUndefined]:
		| [key: Key | Key[], options?: ActualOptions]
		| [
				key: string | string[],
				options: TOpt & $Dictionary & { defaultValue: string },
		  ]
		| [
				key: string | string[],
				defaultValue: string,
				options?: TOpt & $Dictionary,
		  ]
): Promise<I18nextOptionalDetails<Ret, TOpt>> {
	const parsedOptions =
		typeof defaultValueOrOptions === "string"
			? optionsOrUndefined
			: defaultValueOrOptions;

	// An explicit `lng` in the options wins outright — the caller has already decided the language,
	// so there is nothing to resolve from the target.
	const language =
		typeof parsedOptions?.lng === "string"
			? parsedOptions.lng
			: await fetchLanguage(target);

	if (typeof defaultValueOrOptions === "string") {
		return container.i18n.format<Key, TOpt, Ns, Ret>(
			language,
			key,
			defaultValueOrOptions,
			optionsOrUndefined,
		);
	}

	return container.i18n.format<Key, TOpt, Ns, Ret>(
		language,
		key,
		undefined,
		defaultValueOrOptions,
	);
}

/**
 * Resolves a language for a context, applying the fallback chain.
 */
async function resolveLanguage(
	context: InternationalizationContext,
): Promise<string> {
	const language = await container.i18n.fetchLanguage(context);
	return (
		language ??
		context.guild?.preferredLocale ??
		container.i18n.options.defaultName ??
		"en-US"
	);
}

const supportedLanguages = new Set(
	Object.values(Locale),
) as ReadonlySet<LocaleString>;

/**
 * Checks whether a locale is one Discord itself understands.
 */
function isSupportedDiscordLocale(language: string): language is LocaleString {
	return supportedLanguages.has(language as LocaleString);
}

/**
 * The loaded translation functions, narrowed to the locales Discord accepts.
 *
 * Discord rejects a localisation map containing a locale it does not know, so a bot that ships an
 * unrecognised language would have every command registration fail. Dropping those locales here, with
 * a warning, keeps the rest working.
 */
const getLocales = lazy(() => {
	const locales = new Map(container.i18n.languages);

	for (const [locale] of locales) {
		if (isSupportedDiscordLocale(locale)) continue;

		console.warn(
			`[i18n]: Dropping the unsupported Discord locale '${locale}'. It must be one of: ${[...supportedLanguages].join(", ")}`,
		);
		locales.delete(locale);
	}

	return locales;
});

/**
 * The translation function for the default locale, which supplies the non-localised value.
 */
const getDefaultT = lazy(() => {
	const defaultLocale = container.i18n.options.defaultName ?? "en-US";

	if (!isSupportedDiscordLocale(defaultLocale)) {
		throw new TypeError(
			`The default locale '${defaultLocale}' is not one Discord supports: ${[...supportedLanguages].join(", ")}`,
		);
	}

	const defaultT = getLocales().get(defaultLocale);
	if (defaultT) return defaultT;

	throw new TypeError(
		`The default locale '${defaultLocale}' was not loaded, so no localisations can be built from it.`,
	);
});

/**
 * Translates a key into every loaded language at once.
 *
 * This is the primitive the builder helpers are written on: Discord wants a command's name and
 * description as a default value plus a map of per-locale overrides, which is exactly this shape.
 *
 * @param key The key to translate.
 * @returns The default value and the per-locale map.
 *
 * @remarks Only call this after translations have been loaded.
 *
 * @since 1.0.0
 */
export function getLocalizedData<
	const TOpt extends TOptions = TOptions,
	Ns extends Namespace = DefaultNamespace,
	KPrefix = undefined,
>(key: ParseKeys<Ns, TOpt, KPrefix>): LocalizedData {
	const locales = getLocales();
	const defaultT = getDefaultT();

	return {
		value: defaultT(key as never) as string,
		localizations: Object.fromEntries(
			Array.from(locales, ([locale, translate]) => [
				locale,
				translate(key as never),
			]),
		),
	};
}

/**
 * Sets a builder's name and its localisations from one translation key.
 *
 * @param builder The builder to apply the localisations to.
 * @param key The key holding the name.
 * @returns The builder, so calls can be chained.
 *
 * @since 1.0.0
 */
export function applyNameLocalizedBuilder<
	T extends BuilderWithName,
	const TOpt extends TOptions = TOptions,
	Ns extends Namespace = DefaultNamespace,
	KPrefix = undefined,
>(builder: T, key: ParseKeys<Ns, TOpt, KPrefix>) {
	const result = getLocalizedData(key);
	return builder
		.setName(result.value)
		.setNameLocalizations(result.localizations);
}

/**
 * Sets a builder's description and its localisations from one translation key.
 *
 * @param builder The builder to apply the localisations to.
 * @param key The key holding the description.
 * @returns The builder, so calls can be chained.
 *
 * @since 1.0.0
 */
export function applyDescriptionLocalizedBuilder<
	T extends BuilderWithDescription,
	const TOpt extends TOptions = TOptions,
	Ns extends Namespace = DefaultNamespace,
	KPrefix = undefined,
>(builder: T, key: ParseKeys<Ns, TOpt, KPrefix>) {
	const result = getLocalizedData(key);
	return builder
		.setDescription(result.value)
		.setDescriptionLocalizations(result.localizations);
}

/**
 * Sets a builder's name and description, and their localisations, in one call.
 *
 * Pass two keys to name them explicitly, or a single root key and `Name` and `Description` are
 * appended to it — so `"commands:userinfo"` reads `commands:userinfoName` and
 * `commands:userinfoDescription`.
 *
 * @param builder The builder to apply the localisations to.
 * @param params Either one root key, or the name key and the description key.
 * @returns The builder, so calls can be chained.
 *
 * @example
 * ```typescript
 * // Two keys, named explicitly.
 * registry.registerChatInputCommand((builder) =>
 *   applyLocalizedBuilder(builder, "commands/names:userinfo", "commands/descriptions:userinfo").addUserOption((input) =>
 *     applyLocalizedBuilder(input, "commands/options:userinfo-name", "commands/options:userinfo-description").setRequired(true)
 *   )
 * );
 * ```
 *
 * @example
 * ```typescript
 * // One root key, with `Name` and `Description` appended.
 * registry.registerChatInputCommand((builder) =>
 *   applyLocalizedBuilder(builder, "commands:userinfo").addUserOption((input) =>
 *     applyLocalizedBuilder(input, "options:userinfo").setRequired(true)
 *   )
 * );
 * ```
 *
 * @since 1.0.0
 */
export function applyLocalizedBuilder<
	T extends BuilderWithNameAndDescription,
	const TOpt extends TOptions = TOptions,
	Ns extends Namespace = DefaultNamespace,
	KPrefix = undefined,
>(
	builder: T,
	...params:
		| [root: string]
		| [
				name: ParseKeys<Ns, TOpt, KPrefix>,
				description: ParseKeys<Ns, TOpt, KPrefix>,
		  ]
): T {
	const [nameKey, descriptionKey] =
		params.length === 1
			? [
					`${params[0]}Name` as ParseKeys<Ns, TOpt, KPrefix>,
					`${params[0]}Description` as ParseKeys<Ns, TOpt, KPrefix>,
				]
			: params;

	applyNameLocalizedBuilder(builder, nameKey);
	applyDescriptionLocalizedBuilder(builder, descriptionKey);

	return builder;
}

/**
 * Builds a localised choice for a string or number option.
 *
 * `setChoices` takes plain objects rather than a builder, so this fills in `name` and
 * `name_localizations` from a translation key and leaves the rest to you.
 *
 * @param key The key holding the choice's name.
 * @param options The rest of the choice, which must at least include `value`.
 * @returns The choice, ready to hand to `setChoices`.
 *
 * @example
 * ```typescript
 * applyLocalizedBuilder(option, "commands/options:type")
 *   .setRequired(true)
 *   .setChoices(
 *     createLocalizedChoice("selects/pokemon:type-grass", { value: "grass" }),
 *     createLocalizedChoice("selects/pokemon:type-water", { value: "water" })
 *   );
 * ```
 *
 * @since 1.0.0
 */
export function createLocalizedChoice<
	ValueType = string | number,
	const TOpt extends TOptions = TOptions,
	Ns extends Namespace = DefaultNamespace,
	KPrefix = undefined,
>(
	key: ParseKeys<Ns, TOpt, KPrefix>,
	options: Omit<
		APIApplicationCommandOptionChoice<ValueType>,
		"name" | "name_localizations"
	>,
): APIApplicationCommandOptionChoice<ValueType> {
	const result = getLocalizedData(key);

	return {
		...options,
		name: result.value,
		name_localizations: result.localizations,
	};
}
