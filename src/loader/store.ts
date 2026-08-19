import { Collection } from "discord.js";
import { join } from "node:path";
import type {
	AbstractConstructor,
	Constructor,
	Container,
	HydratedModuleData,
	LoaderResultEntry,
	LoaderStrategyContract,
	ModuleData,
	PathLike,
	StoreLogger,
	StoreManuallyRegisteredPiece,
	StoreOptions,
	StoreRegistryKey,
} from "@types";
import { classExtends, isClass } from "@utilities/utilities/index.ts";
import { container } from "@/container.ts";
import { ManuallyRegisteredPieces, VirtualPath } from "./constants.ts";
import { LoaderError, LoaderErrorTypes } from "./errors.ts";
import { resolvePath } from "./path.ts";
import type { Piece } from "./piece.ts";
import { LoaderStrategy } from "./strategy.ts";

const fallbackStrategy = new LoaderStrategy();

/**
 * A named collection of {@link Piece}s, responsible for finding them on disk, constructing them, and
 * keeping them addressable by name.
 *
 * Every loadable structure in Kairo has a store — commands, listeners, preconditions — and all of
 * them are registered on the {@link StoreRegistry} available at `container.stores`.
 *
 * @since 1.0.0
 */
export class Store<
	T extends Piece,
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> extends Collection<string, T> {
	/**
	 * The piece class every entry in this store must extend.
	 */
	public readonly Constructor: AbstractConstructor<T>;

	/**
	 * The name this store is registered under, which is also the folder name it scans for.
	 */
	public readonly name: StoreName;

	/**
	 * The absolute directories this store loads pieces from.
	 */
	public readonly paths: Set<string>;

	/**
	 * The strategy deciding how files are filtered, imported and turned into pieces.
	 */
	public readonly strategy: LoaderStrategyContract<T>;

	/**
	 * Pieces handed to this store directly rather than found on disk, kept so they survive a reload.
	 */
	public readonly [ManuallyRegisteredPieces] = new Map<
		string,
		StoreManuallyRegisteredPiece<StoreName>
	>();

	/**
	 * Whether {@link Store.loadAll} has run at least once.
	 */
	#loadedAll = false;

	/**
	 * The bound directory walker, taken from the strategy when it supplies one.
	 */
	#walk: LoaderStrategy<T>["walk"];

	/**
	 * @param pieceConstructor The piece class every entry must extend.
	 * @param options The store's name, search paths and strategy.
	 */
	public constructor(
		pieceConstructor: AbstractConstructor<T>,
		options: StoreOptions<T, StoreName>,
	) {
		super();

		this.Constructor = pieceConstructor;
		this.name = options.name as StoreName;
		this.paths = new Set(options.paths ?? []);
		this.strategy = options.strategy ?? Store.defaultStrategy;

		this.#walk =
			typeof this.strategy.walk === "function"
				? this.strategy.walk.bind(this.strategy)
				: fallbackStrategy.walk.bind(fallbackStrategy);
	}

	/**
	 * Shorthand for the shared {@link container}.
	 *
	 * @see {@link container}
	 */
	public get container(): Container {
		return container;
	}

	/**
	 * Adds a directory for this store to load pieces from.
	 *
	 * @param path The directory to add.
	 *
	 * @example
	 * ```typescript
	 * store
	 *   .registerPath(resolve("commands"))
	 *   .registerPath(resolve("third-party", "commands"));
	 * ```
	 */
	public registerPath(path: PathLike): this {
		const root = resolvePath(path);

		this.paths.add(root);
		Store.logger?.(
			`[STORE => ${this.name}] [REGISTER] Registered path '${root}'.`,
		);
		return this;
	}

	/**
	 * Hands a piece to this store directly, without it existing as a file.
	 *
	 * If {@link Store.loadAll} has already run the piece is loaded straight away; otherwise it waits
	 * in a queue until it does. Registered pieces are kept even after loading so a later
	 * {@link Store.loadAll} picks them up again.
	 *
	 * @remarks
	 * - The piece's root and path are both {@link VirtualPath}, so it can never be reloaded.
	 * - Useful where the file system is unavailable or read-only, such as serverless deployments.
	 * - Nothing is registered if validation fails — the operation either fully succeeds or throws.
	 *
	 * @param entry The name and class to register.
	 * @throws {TypeError} If `entry.piece` is not a class.
	 * @throws {@link LoaderError} If `entry.piece` does not extend this store's constructor.
	 *
	 * @see {@link StoreRegistry.loadPiece}
	 *
	 * @example
	 * ```typescript
	 * import { container } from "kairojs";
	 *
	 * class PingCommand extends Command {
	 *   // ...
	 * }
	 *
	 * container.stores.get("commands").loadPiece({
	 *   name: "ping",
	 *   piece: PingCommand
	 * });
	 * ```
	 */
	public async loadPiece(entry: StoreManuallyRegisteredPiece<StoreName>) {
		if (!isClass(entry.piece)) {
			throw new TypeError(
				`The piece ${entry.name} is not a Class. ${String(entry.piece)}`,
			);
		}

		if (!classExtends(entry.piece, this.Constructor as Constructor<T>)) {
			throw new LoaderError(
				LoaderErrorTypes.IncorrectType,
				`The piece ${entry.name} does not extend ${this.name}`,
			);
		}

		this[ManuallyRegisteredPieces].set(entry.name, entry);

		if (this.#loadedAll) {
			await this.insert(this.#constructVirtual(entry));
		}
	}

	/**
	 * Loads every piece exported by a single file.
	 *
	 * @param root The registered directory the file sits under.
	 * @param path The file's path, relative to `root`.
	 * @returns Every piece the file produced.
	 * @throws {@link LoaderError} If called with the virtual root, which has no file behind it.
	 */
	public async load(root: string, path: string): Promise<T[]> {
		if (root === VirtualPath) {
			throw new LoaderError(
				LoaderErrorTypes.VirtualPiece,
				`Cannot load a virtual file.`,
			);
		}

		const full = join(root, path);
		const data = this.strategy.filter(full);
		if (data === null) {
			Store.logger?.(
				`[STORE => ${this.name}] [LOAD] Skipped piece '${full}' as 'LoaderStrategy#filter' returned 'null'.`,
			);
			return [];
		}

		const loading: Promise<T>[] = [];
		const hydrated = this.#hydrate(root, data);
		for await (const PieceConstructor of this.strategy.load(this, hydrated)) {
			loading.push(this.insert(this.construct(PieceConstructor, hydrated)));
		}

		return Promise.all(loading);
	}

	/**
	 * Removes a piece from this store, running its unload hooks first.
	 *
	 * @param name The piece, or the name it is stored under.
	 * @returns The piece that was removed.
	 */
	public async unload(name: string | T): Promise<T> {
		const piece = this.resolve(name);

		this.strategy.onUnload(this, piece);
		await piece.onUnload();
		Store.logger?.(
			`[STORE => ${this.name}] [UNLOAD] Unloaded piece '${piece.name}'.`,
		);

		this.delete(piece.name);
		Store.logger?.(
			`[STORE => ${this.name}] [UNLOAD] Removed piece '${piece.name}'.`,
		);
		return piece;
	}

	/**
	 * Removes every piece from this store.
	 */
	public async unloadAll(): Promise<T[]> {
		const unloading: Promise<T>[] = [];
		for (const piece of this.values()) {
			unloading.push(this.unload(piece));
		}

		const unloaded = await Promise.all(unloading);

		this.strategy.onUnloadAll(this);
		Store.logger?.(`[STORE => ${this.name}] [UNLOAD-ALL] Removed all pieces.`);
		return unloaded;
	}

	/**
	 * Discovers and loads every piece from every registered path, plus every manually registered
	 * piece, replacing whatever the store held before.
	 *
	 * Construction happens before the store is cleared, so a file that throws leaves the previously
	 * loaded pieces untouched.
	 */
	public async loadAll(): Promise<void> {
		this.#loadedAll = true;

		const pieces: T[] = [];
		for (const entry of this[ManuallyRegisteredPieces].values()) {
			pieces.push(this.#constructVirtual(entry));
		}

		for (const path of this.paths) {
			for await (const piece of this.#loadPath(path)) {
				pieces.push(piece);
			}
		}

		Store.logger?.(
			`[STORE => ${this.name}] [LOAD-ALL] Found '${pieces.length}' pieces.`,
		);

		await this.unloadAll();
		Store.logger?.(`[STORE => ${this.name}] [LOAD-ALL] Cleared all pieces.`);

		for (const piece of pieces) {
			await this.insert(piece);
		}

		this.strategy.onLoadAll(this);
		Store.logger?.(
			`[STORE => ${this.name}] [LOAD-ALL] Successfully loaded '${this.size}' pieces.`,
		);
	}

	/**
	 * Looks up a piece by name, or validates one that was passed directly.
	 *
	 * @param name The piece, or the name it is stored under.
	 * @throws {@link LoaderError} If the name is not in this store, or the instance is of the wrong type.
	 */
	public resolve(name: string | T): T {
		if (typeof name === "string") {
			const piece = this.get(name);
			if (typeof piece === "undefined") {
				throw new LoaderError(
					LoaderErrorTypes.UnloadedPiece,
					`The piece '${name}' does not exist.`,
				);
			}

			return piece;
		}

		if (name instanceof this.Constructor) return name;
		throw new LoaderError(
			LoaderErrorTypes.IncorrectType,
			`The piece '${name.name}' is not an instance of '${this.Constructor.name}'.`,
		);
	}

	/**
	 * Runs a constructed piece's load hooks and stores it under its name.
	 *
	 * A piece may disable itself from within `onLoad`, so `enabled` is checked again afterwards; a
	 * piece that opted out is unloaded again and never reaches the store. An existing piece with the
	 * same name is unloaded first, which is what lets a reload replace it cleanly.
	 *
	 * @param piece The piece to insert.
	 * @returns The same piece, whether or not it ended up stored.
	 */
	public async insert(piece: T): Promise<T> {
		if (!piece.enabled) return piece;

		this.strategy.onLoad(this, piece);
		await piece.onLoad();
		Store.logger?.(
			`[STORE => ${this.name}] [INSERT] Loaded new piece '${piece.name}'.`,
		);

		// `onLoad` is allowed to opt the piece out, so re-check rather than trusting the earlier read.
		if (!piece.enabled) {
			this.strategy.onUnload(this, piece);
			await piece.onUnload();
			Store.logger?.(
				`[STORE => ${this.name}] [INSERT] Unloaded new piece '${piece.name}' due to 'enabled' being 'false'.`,
			);

			return piece;
		}

		const previous = super.get(piece.name);
		if (previous) {
			await this.unload(previous);
			Store.logger?.(
				`[STORE => ${this.name}] [INSERT] Unloaded existing piece '${piece.name}' due to conflicting 'name'.`,
			);
		}

		this.set(piece.name, piece);
		Store.logger?.(
			`[STORE => ${this.name}] [INSERT] Inserted new piece '${piece.name}'.`,
		);
		return piece;
	}

	/**
	 * Builds a piece instance from its class and the module it came from.
	 *
	 * @param PieceConstructor The class to instantiate.
	 * @param data Where the module was found.
	 */
	public construct(
		PieceConstructor: LoaderResultEntry<T>,
		data: HydratedModuleData,
	): T {
		return new PieceConstructor(
			// `PieceLoaderContext.store` resolves through `StoreRegistryEntries`, so for an unresolved
			// `StoreName` it is the union of every registered store rather than this one. The cast says
			// what is true at runtime: a store only ever constructs its own pieces.
			{
				store: this as never,
				root: data.root,
				path: data.path,
				name: data.name,
			},
			{ name: data.name, enabled: true },
		);
	}

	/**
	 * Builds a piece instance for a manually registered entry, pointing it at the virtual path.
	 */
	#constructVirtual(entry: StoreManuallyRegisteredPiece<StoreName>): T {
		return this.construct(entry.piece as unknown as LoaderResultEntry<T>, {
			name: entry.name,
			root: VirtualPath,
			path: VirtualPath,
			extension: VirtualPath,
		});
	}

	/**
	 * Attaches the root directory to the data the strategy's filter produced.
	 */
	#hydrate(root: string, data: ModuleData): HydratedModuleData {
		return { root, ...data };
	}

	/**
	 * Walks one registered directory and yields a constructed piece for every class it finds.
	 *
	 * A file that throws is reported through the strategy and skipped, so one broken piece cannot
	 * stop the rest of the store from loading.
	 */
	async *#loadPath(root: string): AsyncIterableIterator<T> {
		Store.logger?.(
			`[STORE => ${this.name}] [WALK] Loading all pieces from '${root}'.`,
		);

		for await (const child of this.#walk(this, root, Store.logger)) {
			const data = this.strategy.filter(child);
			if (data === null) {
				Store.logger?.(
					`[STORE => ${this.name}] [LOAD] Skipped piece '${child}' as 'LoaderStrategy#filter' returned 'null'.`,
				);
				continue;
			}

			try {
				const hydrated = this.#hydrate(root, data);
				for await (const PieceConstructor of this.strategy.load(
					this,
					hydrated,
				)) {
					yield this.construct(PieceConstructor, hydrated);
				}
			} catch (error) {
				this.strategy.onError(error as Error, data.path);
			}
		}
	}

	/**
	 * The strategy used by stores that were not given one. Shared, and constructed once.
	 */
	public static defaultStrategy: LoaderStrategyContract<any> = fallbackStrategy;

	/**
	 * Where stores report what they are doing. `null` disables logging entirely, which is the default.
	 */
	public static logger: StoreLogger | null = null;
}
