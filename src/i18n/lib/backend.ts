import type {
	BackendModule,
	ReadCallback,
	ResourceKey,
	Services,
} from "i18next";
import type {
	I18nextBackendOptions,
	LanguagePathResolvable,
	PathLike,
} from "@types";

/**
 * Reads translations off the file system for `i18next`.
 *
 * `i18next` has no opinion about where translations live; a backend is the piece that answers "give
 * me namespace *n* in language *l*". This one resolves that pair against the registered paths and
 * reads the JSON with {@link Bun.file}, which is all a file-system backend ever needed to be.
 *
 * Registering more than one path makes a namespace the merge of every path that has it, later paths
 * winning. That is how a bot keeps its own translations alongside a shared set and overrides
 * individual keys without copying the rest.
 *
 * @since 1.0.0
 */
export class I18nextFilesystemBackend
	implements BackendModule<I18nextBackendOptions>
{
	/**
	 * Identifies this class to `i18next` as a backend. The static form is what lets the class itself
	 * be passed to `i18next.use`, rather than an instance.
	 */
	public static readonly type = "backend";

	/**
	 * Identifies this instance to `i18next` as a backend.
	 */
	public readonly type = "backend";

	/**
	 * The registered lookup paths, in the order they are read and merged.
	 */
	#paths: readonly LanguagePathResolvable[] = [];

	/**
	 * Receives the backend options from `i18next.init`.
	 *
	 * @param _services The `i18next` internals, none of which a file-system backend needs.
	 * @param backendOptions The lookup paths to read translations from.
	 */
	public init(_services: Services, backendOptions: I18nextBackendOptions) {
		this.#paths = backendOptions?.paths ?? [];
	}

	/**
	 * Loads one namespace in one language and hands it back through `i18next`'s callback.
	 *
	 * @param language The language being loaded.
	 * @param namespace The namespace being loaded.
	 * @param callback Where the parsed translations, or the failure, are reported.
	 */
	public read(language: string, namespace: string, callback: ReadCallback) {
		if (this.#paths.length === 0) {
			callback(
				new Error(
					"No language paths have been registered, so no translations can be read.",
				),
				null,
			);
			return;
		}

		this.#readAll(language, namespace).then(
			(data) => callback(null, data),
			(error: unknown) => callback(error as Error, false),
		);
	}

	/**
	 * Reads a namespace from every registered path and merges the results.
	 *
	 * A path that has no such file is not an error on its own — only every path failing is, since
	 * that is the case where the namespace genuinely does not exist.
	 */
	async #readAll(language: string, namespace: string): Promise<ResourceKey> {
		const first = this.#paths[0]!;
		if (this.#paths.length === 1)
			return readTranslations(resolveLanguagePath(first, language, namespace));

		const outcomes = await Promise.allSettled(
			this.#paths.map((path) =>
				readTranslations(resolveLanguagePath(path, language, namespace)),
			),
		);

		const found = outcomes
			.filter((outcome) => outcome.status === "fulfilled")
			.map((outcome) => outcome.value);
		if (found.length === 0) {
			throw new AggregateError(
				outcomes.map((outcome) => (outcome as PromiseRejectedResult).reason),
				`The namespace '${namespace}' of language '${language}' was not found under any registered path.`,
			);
		}

		return Object.assign({}, ...found) as ResourceKey;
	}
}

/**
 * Reads and parses one translation file.
 *
 * @param path The file to read.
 * @returns The parsed translations.
 */
function readTranslations(path: PathLike): Promise<ResourceKey> {
	return Bun.file(path).json();
}

/**
 * Turns a registered path into the concrete file holding a given language and namespace.
 *
 * A function is trusted to produce the final path itself; a template has its `{{lng}}` and `{{ns}}`
 * placeholders substituted.
 *
 * @param path The registered path.
 * @param language The language being loaded.
 * @param namespace The namespace being loaded.
 * @returns The file to read.
 */
function resolveLanguagePath(
	path: LanguagePathResolvable,
	language: string,
	namespace: string,
): PathLike {
	if (typeof path === "function") return path(language, namespace);

	const template = typeof path === "string" ? path : Bun.fileURLToPath(path);
	return template.replaceAll(/\{\{(?:lng|ns)\}\}/g, (placeholder) =>
		placeholder === "{{lng}}" ? language : namespace,
	);
}
