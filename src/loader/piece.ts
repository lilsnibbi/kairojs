import type {
	Awaitable,
	Container,
	PieceJSON,
	PieceLoaderContext,
	PieceOptions,
	StoreOf,
	StoreRegistryKey,
} from "@types";
import { container } from "@/container.ts";
import { PieceLocation } from "./pieceLocation.ts";

/**
 * The base unit Kairo loads: a class discovered in a registered directory, constructed by its store
 * and kept in it by name.
 *
 * Commands, listeners, preconditions and every other loadable structure extend this. Subclasses
 * override {@link Piece.onLoad} and {@link Piece.onUnload} to take part in the lifecycle.
 *
 * @since 1.0.0
 */
export class Piece<
	Options extends PieceOptions = PieceOptions,
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> {
	/**
	 * The store holding this piece.
	 */
	public readonly store: StoreOf<StoreName>;

	/**
	 * Where this piece was loaded from.
	 */
	public readonly location: PieceLocation;

	/**
	 * The name this piece is stored and looked up under. Defaults to the file name.
	 */
	public readonly name: string;

	/**
	 * Whether this piece is active. Setting it to `false` before load keeps the piece out of its
	 * store entirely.
	 */
	public enabled: boolean;

	/**
	 * The options this piece was constructed with, exactly as passed.
	 */
	public readonly options: Options;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The piece's own options.
	 */
	public constructor(
		context: PieceLoaderContext<StoreName>,
		options: PieceOptions = {},
	) {
		this.store = context.store;
		this.location = new PieceLocation(context.path, context.root);
		this.name = options.name ?? context.name;
		this.enabled = options.enabled ?? true;
		this.options = options as Options;
	}

	/**
	 * Shorthand for the shared {@link container}, so pieces can reach shared services without
	 * importing it.
	 *
	 * @see {@link container}
	 */
	public get container(): Container {
		return container;
	}

	/**
	 * Runs when this piece is loaded into its store, before it becomes reachable. Override it to do
	 * asynchronous set-up; setting `this.enabled = false` here aborts the load.
	 */
	public onLoad(): Awaitable<unknown> {
		return undefined;
	}

	/**
	 * Runs when this piece is removed from its store. Override it to release anything the piece
	 * acquired — timers, listeners, connections.
	 */
	public onUnload(): Awaitable<unknown> {
		return undefined;
	}

	/**
	 * Removes this piece from its store and marks it disabled.
	 */
	public async unload() {
		await this.store.unload(this.name);
		this.enabled = false;
	}

	/**
	 * Reloads this piece by re-reading its file, replacing the instance in the store.
	 */
	public async reload() {
		await this.store.load(this.location.root, this.location.relative);
	}

	/**
	 * Defines how this piece is serialised by `JSON.stringify`.
	 */
	public toJSON(): PieceJSON {
		return {
			location: this.location.toJSON(),
			name: this.name,
			enabled: this.enabled,
			options: this.options,
		};
	}
}
