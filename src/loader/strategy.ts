import { basename, extname } from "node:path";
import type {
	Awaitable,
	FilterResult,
	HydratedModuleData,
	LoaderResult,
	LoaderResultEntry,
	LoaderStrategyContract,
	ModuleData,
	PreloadResult,
	StoreLogger,
} from "@types";
import { classExtends, isClass } from "@utilities/common/index.ts";
import { walkFiles } from "@utilities/fs/index.ts";
import { MissingExportsError } from "./errors.ts";
import type { Piece } from "./piece.ts";
import type { Store } from "./store.ts";

/**
 * The extensions Kairo will attempt to load pieces from. Bun executes TypeScript directly, so no
 * build output is involved and no CommonJS variants exist.
 */
const SupportedExtensions = [".ts", ".js"];

/**
 * The default loader strategy: discovers files, imports them as ES modules, and yields every
 * exported class that extends the store's piece constructor.
 *
 * A single module may export several pieces; all of them are loaded.
 *
 * @since 1.0.0
 */
export class LoaderStrategy<T extends Piece>
	implements LoaderStrategyContract<T>
{
	/**
	 * The file extensions this strategy will load.
	 */
	public supportedExtensions = [...SupportedExtensions];

	/**
	 * Decides whether a discovered path is loadable, and extracts its name and extension.
	 *
	 * Files are skipped when their extension is unsupported, when they are TypeScript declaration
	 * files, and when their name is empty or begins with an underscore — the last of which is the
	 * convention for helper modules that sit alongside pieces without being pieces themselves.
	 *
	 * @param path The absolute path of the discovered file.
	 * @returns The module's data, or `null` to skip the file.
	 */
	public filter(path: string): FilterResult {
		const extension = extname(path);
		if (!this.supportedExtensions.includes(extension)) return null;

		if (path.endsWith(".d.ts")) return null;

		const name = basename(path, extension);
		if (name === "" || name.startsWith("_")) return null;

		return { extension, path, name };
	}

	/**
	 * Imports a module so its exports can be inspected.
	 *
	 * A unique query string is appended to the specifier on every call. Without it Bun would serve
	 * the cached module and reloading a piece after editing its file would silently do nothing,
	 * which is what makes hot reloading work.
	 *
	 * @param file The module to import.
	 */
	public async preload(file: ModuleData): PreloadResult<T> {
		const parameters = new URLSearchParams({
			loadedAt: Date.now().toString(),
			name: file.name,
			extension: file.extension,
		});

		return import(`${file.path}?${parameters.toString()}`);
	}

	/**
	 * Imports a module and yields every export that is a class extending the store's piece
	 * constructor.
	 *
	 * @param store The store requesting the load.
	 * @param file The module to load.
	 * @throws {@link MissingExportsError} When the module exported nothing the store can use.
	 */
	public async *load(
		store: Store<T>,
		file: HydratedModuleData,
	): LoaderResult<T> {
		let yielded = false;
		const module = await this.preload(file);

		// A module whose default-ish export is itself the class.
		if (isClass(module) && classExtends(module, store.Constructor)) {
			yield module;
			yielded = true;
		}

		// Every named export, so one file may declare several pieces.
		for (const exported of Object.values(module)) {
			if (isClass(exported) && classExtends(exported, store.Constructor)) {
				yield exported as LoaderResultEntry<T>;
				yielded = true;
			}
		}

		if (!yielded) {
			throw new MissingExportsError(file.path);
		}
	}

	/**
	 * Runs after a piece is constructed but before it is inserted into its store.
	 */
	public onLoad(store: Store<T>, piece: T): Awaitable<unknown>;
	public onLoad(): unknown {
		return undefined;
	}

	/**
	 * Runs once every piece in the store has been loaded.
	 */
	public onLoadAll(store: Store<T>): Awaitable<unknown>;
	public onLoadAll(): unknown {
		return undefined;
	}

	/**
	 * Runs after a piece is removed from its store, whether unloaded or replaced.
	 */
	public onUnload(store: Store<T>, piece: T): Awaitable<unknown>;
	public onUnload(): unknown {
		return undefined;
	}

	/**
	 * Runs once every piece in the store has been unloaded.
	 */
	public onUnloadAll(store: Store<T>): Awaitable<unknown>;
	public onUnloadAll(): unknown {
		return undefined;
	}

	/**
	 * Reports a file that could not be loaded, without aborting the rest of the walk.
	 *
	 * @param error The error that was thrown.
	 * @param path The file that caused it.
	 */
	public onError(error: Error, path: string): void {
		console.error(`Error when loading '${path}':`, error);
	}

	/**
	 * Recursively yields every file under a registered directory.
	 *
	 * A directory that does not exist is not an error: stores register a path per store name whether
	 * or not the bot actually has that folder, so a missing one is simply empty.
	 *
	 * @param store The store the walk is for.
	 * @param path The directory to walk.
	 * @param logger The logger to report progress to, if any.
	 */
	public async *walk(
		store: Store<T>,
		path: string,
		logger?: StoreLogger | null,
	): AsyncIterableIterator<string> {
		logger?.(
			`[STORE => ${store.name}] [WALK] Loading all pieces from '${path}'.`,
		);

		try {
			yield* walkFiles(path);
		} catch (error) {
			// A missing directory simply means this store has no pieces here; anything else is real.
			if ((error as NodeJS.ErrnoException).code !== "ENOENT")
				this.onError(error as Error, path);
		}
	}
}
