import type { AliasPiece } from "@/loader/alias-piece.ts";
import type { LoaderErrorTypes } from "@/loader/errors.ts";
import type { Piece } from "@/loader/piece.ts";
import type { PieceLocation } from "@/loader/piece-location.ts";
import type { Store } from "@/loader/store.ts";
import type { StoreRegistry } from "@/loader/store-registry.ts";
import type { KairoClient } from "@/client.ts";
import type { Logger } from "./logger.d.ts";
import type { ArgumentStore } from "@/structures/argument-store.ts";
import type { CommandStore } from "@/structures/command-store.ts";
import type { InteractionHandlerStore } from "@/structures/interaction-handler-store.ts";
import type { ListenerStore } from "@/structures/listener-store.ts";
import type { PatternCommandStore } from "@/structures/pattern-command-store.ts";
import type { PreconditionStore } from "@/structures/precondition-store.ts";
import type { UtilitiesStore } from "@/structures/utility-store.ts";
import type { Awaitable, Constructor, Ctor } from "./utilities/utilities.d.ts";

/**
 * A path accepted anywhere Kairo takes one: either a plain string or a `file:` URL.
 *
 * @since 1.0.0
 */
export type PathLike = string | URL;

/**
 * The directory Kairo treats as the root of the bot's source tree.
 *
 * @since 1.0.0
 */
export interface RootData {
	/**
	 * The absolute path of the root directory.
	 */
	root: string;
}

/**
 * The kinds of failure the piece loader can report, derived from the runtime constant so the two
 * can never drift apart.
 *
 * @since 1.0.0
 */
export type LoaderErrorType =
	(typeof LoaderErrorTypes)[keyof typeof LoaderErrorTypes];

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                    */
/* -------------------------------------------------------------------------- */

/**
 * What a store hands a piece when constructing it: where the file was found and who is loading it.
 *
 * @since 1.0.0
 */
export interface PieceLoaderContext<
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> {
	/**
	 * The registered directory the piece was discovered under.
	 */
	readonly root: string;

	/**
	 * The absolute path of the module the piece came from.
	 */
	readonly path: string;

	/**
	 * The piece's name, taken from the file name.
	 */
	readonly name: string;

	/**
	 * The store performing the load.
	 */
	readonly store: StoreOf<StoreName>;
}

/**
 * The options every piece accepts.
 *
 * @since 1.0.0
 */
export interface PieceOptions {
	/**
	 * The name the piece is stored and looked up under.
	 *
	 * @default the file name
	 */
	readonly name?: string;

	/**
	 * Whether the piece should be loaded at all. A disabled piece never enters its store.
	 *
	 * @default true
	 */
	readonly enabled?: boolean;
}

/**
 * The options an alias-capable piece accepts.
 *
 * @since 1.0.0
 */
export interface AliasPieceOptions extends PieceOptions {
	/**
	 * Alternative names the piece can also be reached by.
	 *
	 * @default []
	 */
	readonly aliases?: readonly string[];
}

/**
 * The shape produced by `PieceLocation#toJSON`.
 *
 * @since 1.0.0
 */
export interface PieceLocationJSON {
	directories: string[];
	full: string;
	name: string;
	relative: string;
	root: string;
}

/**
 * The shape produced by `Piece#toJSON`.
 *
 * @since 1.0.0
 */
export interface PieceJSON {
	location: PieceLocationJSON;
	name: string;
	enabled: boolean;
	options: PieceOptions;
}

/**
 * The shape produced by `AliasPiece#toJSON`.
 *
 * @since 1.0.0
 */
export interface AliasPieceJSON extends PieceJSON {
	aliases: string[];
	options: AliasPieceOptions;
}

/* -------------------------------------------------------------------------- */
/*                                   Stores                                    */
/* -------------------------------------------------------------------------- */

/**
 * The options a store is constructed with.
 *
 * @since 1.0.0
 */
export interface StoreOptions<
	T extends Piece,
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> {
	/**
	 * The name the store is registered under, which is also the folder name it scans for.
	 */
	readonly name: StoreName;

	/**
	 * Absolute directories to load pieces from.
	 *
	 * @default []
	 */
	readonly paths?: readonly string[];

	/**
	 * The strategy deciding how files become pieces.
	 *
	 * @default the shared default strategy
	 */
	readonly strategy?: LoaderStrategyContract<T>;
}

/**
 * Receives every line a store emits about what it is doing.
 *
 * Messages are formatted as `[STORE => ${name}] [${type}] ${content}`, with identifiers quoted:
 *
 * - `[STORE => commands] [LOAD] Skipped piece '/home/me/bot/src/commands/foo.ts' as 'LoaderStrategy#filter' returned 'null'.`
 * - `[STORE => commands] [INSERT] Unloaded new piece 'foo' due to 'enabled' being 'false'.`
 * - `[STORE => commands] [UNLOAD] Unloaded piece 'foo'.`
 *
 * @since 1.0.0
 */
export type StoreLogger = (value: string) => void;

/**
 * An entry registered directly on a store rather than discovered on disk.
 *
 * @since 1.0.0
 */
export interface StoreManuallyRegisteredPiece<
	StoreName extends StoreRegistryKey,
> {
	name: string;
	piece: StoreRegistryEntries[StoreName] extends Store<infer PieceType>
		? Constructor<PieceType>
		: never;
}

/**
 * An entry registered through the registry, which names the store it belongs to.
 *
 * @since 1.0.0
 */
export interface StoreRegistryManuallyRegisteredPiece<
	StoreName extends StoreRegistryKey,
> extends StoreManuallyRegisteredPiece<StoreName> {
	store: StoreName;
}

/**
 * The stores available on `container.stores`.
 *
 * This interface is deliberately empty: Kairo fills it in for its own stores, and bot authors
 * augment it when adding their own so lookups stay strictly typed.
 *
 * @since 1.0.0
 */
export interface StoreRegistryEntries {
	arguments: ArgumentStore;
	commands: CommandStore;
	"interaction-handlers": InteractionHandlerStore;
	listeners: ListenerStore;
	"pattern-commands": PatternCommandStore;
	preconditions: PreconditionStore;
	utilities: UtilitiesStore;
}

/**
 * Every registered store name.
 *
 * @since 1.0.0
 */
export type StoreRegistryKey = keyof StoreRegistryEntries;

/**
 * Every registered store.
 *
 * @since 1.0.0
 */
export type StoreRegistryValue = StoreRegistryEntries[StoreRegistryKey];

/**
 * Resolves a store name to the store itself, falling back to a generic store while
 * `StoreRegistryEntries` is still empty.
 *
 * @since 1.0.0
 */
export type StoreOf<StoreName extends StoreRegistryKey> =
	StoreRegistryKey extends never
		? Store<Piece<PieceOptions, StoreName>>
		: StoreRegistryEntries[StoreName];

/**
 * Resolves a store name to the kind of piece that store holds.
 *
 * @since 1.0.0
 */
export type PieceOf<StoreName extends StoreRegistryKey> =
	StoreRegistryKey extends never
		? Piece<PieceOptions, StoreName>
		: StoreRegistryEntries[StoreName] extends Store<infer PieceType>
			? PieceType
			: Piece<PieceOptions, StoreName>;

/* -------------------------------------------------------------------------- */
/*                                  Strategy                                   */
/* -------------------------------------------------------------------------- */

/**
 * What a strategy's filter learned about a discovered file.
 *
 * @since 1.0.0
 */
export interface ModuleData {
	/**
	 * The piece's name, taken from the file name without its extension.
	 */
	name: string;

	/**
	 * The absolute path of the module.
	 */
	path: string;

	/**
	 * The module's file extension, leading dot included.
	 */
	extension: string;
}

/**
 * Module data with the registered directory it was found under attached.
 *
 * @since 1.0.0
 */
export interface HydratedModuleData extends ModuleData {
	/**
	 * The registered directory the module was discovered under.
	 */
	root: string;
}

/**
 * What a strategy's filter returns: the module's data, or `null` to skip the file.
 *
 * @since 1.0.0
 */
export type FilterResult = ModuleData | null;

/**
 * What a strategy's preload resolves to — the imported module namespace.
 *
 * @since 1.0.0
 */
export type PreloadResult<T extends Piece> = Promise<
	Constructor<T> & Record<PropertyKey, unknown>
>;

/**
 * A single class yielded by a strategy's load.
 *
 * @since 1.0.0
 */
export type LoaderResultEntry<T extends Piece> = Ctor<
	ConstructorParameters<typeof Piece>,
	T
>;

/**
 * The stream of classes a strategy's load yields.
 *
 * @since 1.0.0
 */
export type LoaderResult<T extends Piece> = AsyncIterableIterator<
	LoaderResultEntry<T>
>;

/**
 * What a store needs from a loader strategy.
 *
 * Implement this to change how pieces are discovered or imported; extend the built-in strategy
 * instead when you only want to adjust part of it.
 *
 * @since 1.0.0
 */
export interface LoaderStrategyContract<T extends Piece> {
	/**
	 * Decides whether a discovered path is loadable and extracts its module data.
	 *
	 * @param path The absolute path of the discovered file.
	 * @returns The module's data, or `null` to skip it.
	 */
	filter(path: string): FilterResult;

	/**
	 * Imports a module so its exports can be inspected.
	 *
	 * @param file The module to import.
	 */
	preload(file: ModuleData): PreloadResult<T>;

	/**
	 * Yields every piece class the module exports.
	 *
	 * @param store The store requesting the load.
	 * @param file The module to load.
	 */
	load(store: Store<T>, file: HydratedModuleData): LoaderResult<T>;

	/**
	 * Runs after a piece is constructed, before its own `onLoad` and before it is stored.
	 *
	 * @param store The store holding the piece.
	 * @param piece The piece that was loaded.
	 */
	onLoad(store: Store<T>, piece: T): Awaitable<unknown>;

	/**
	 * Runs once every piece in the store has been loaded.
	 *
	 * @param store The store that finished loading.
	 */
	onLoadAll(store: Store<T>): Awaitable<unknown>;

	/**
	 * Runs after a piece is removed, whether unloaded outright or replaced by a reload.
	 *
	 * @param store The store that held the piece.
	 * @param piece The piece that was removed.
	 */
	onUnload(store: Store<T>, piece: T): Awaitable<unknown>;

	/**
	 * Runs once every piece in the store has been unloaded.
	 *
	 * @param store The store that was emptied.
	 */
	onUnloadAll(store: Store<T>): Awaitable<unknown>;

	/**
	 * Reports a file that could not be loaded, without aborting the rest of the walk.
	 *
	 * @param error The error that was thrown.
	 * @param path The file that caused it.
	 */
	onError(error: Error, path: string): void;

	/**
	 * Recursively yields every file under a directory. Omit it to use the default walker.
	 *
	 * @param store The store the walk is for.
	 * @param path The directory to walk.
	 * @param logger The logger to report progress to, if any.
	 */
	walk?(
		store: Store<T>,
		path: string,
		logger?: StoreLogger | null,
	): AsyncIterableIterator<string>;
}

/* -------------------------------------------------------------------------- */
/*                                  Container                                  */
/* -------------------------------------------------------------------------- */

/**
 * The shared service bag reachable from every piece through `this.container`.
 *
 * Kairo populates `client`, `stores` and `logger`; anything else is added by the bot itself. Augment
 * this interface from `declare module "kairojs"` to type your own additions.
 *
 * @since 1.0.0
 */
export interface Container {
	/**
	 * The running client. Assigned first thing in the client's constructor, so it is available to
	 * every hook and piece that follows.
	 */
	client: KairoClient;

	/**
	 * Every store the bot has registered.
	 */
	stores: StoreRegistry;

	/**
	 * Where the framework writes its diagnostics.
	 */
	logger: Logger;

	/**
	 * The entry point to the application command registries, through which a command's registry is
	 * looked up or created.
	 */
	applicationCommandRegistries: {
		acquire: typeof import("@/application-commands/registries.ts").acquire;
	};
}

export type { AliasPiece, Piece, PieceLocation, Store, StoreRegistry };
