import { Collection } from "discord.js";
import { join } from "node:path";
import type {
	PathLike,
	StoreOf,
	StoreRegistryEntries,
	StoreManuallyRegisteredPiece,
	StoreRegistryKey,
	StoreRegistryManuallyRegisteredPiece,
	StoreRegistryValue,
} from "@types";
import { isClass } from "@utilities/utilities/index.ts";
import { ManuallyRegisteredPieces } from "./constants.ts";
import { resolvePath } from "./path.ts";
import { getRootData } from "./root.ts";
import type { Piece } from "./piece.ts";
import type { Store } from "./store.ts";

/**
 * The registry of every {@link Store} the bot has, reachable as `container.stores`.
 *
 * Registering a store here is what lets Kairo drive it: give it a search path, load it on login, and
 * route manually registered pieces to it.
 *
 * Augment `StoreRegistryEntries` to teach the registry about a store you add yourself.
 *
 * @example
 * ```typescript
 * container.stores.register(new RouteStore());
 *
 * declare module "kairojs" {
 *   interface StoreRegistryEntries {
 *     routes: RouteStore;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class StoreRegistry extends Collection<
	StoreRegistryKey,
	StoreRegistryValue
> {
	/**
	 * Pieces registered for a store that has not been registered yet, held until it is.
	 */
	readonly #pending = new Collection<
		StoreRegistryKey,
		StoreManuallyRegisteredPiece<StoreRegistryKey>[]
	>();

	/**
	 * Looks up a store by name.
	 *
	 * The overloads narrow the result to the exact store a name maps to, so
	 * `container.stores.get("commands")` is a `CommandStore` rather than a union of every registered
	 * store. A name that is not registered resolves to `undefined` at the type level too, which is
	 * what makes a typo fail to compile instead of producing a value nothing can be done with.
	 *
	 * @param key The registered store name.
	 */
	public override get<K extends StoreRegistryKey>(
		key: K,
	): StoreRegistryEntries[K];
	public override get(key: string): undefined;
	public override get(key: string): StoreRegistryValue | undefined {
		return super.get(key as StoreRegistryKey);
	}

	/**
	 * Whether a store is registered under the given name.
	 *
	 * @param key The store name to check.
	 */
	public override has(key: StoreRegistryKey): true;
	public override has(key: string): false;
	public override has(key: string): boolean {
		return super.has(key as StoreRegistryKey);
	}

	/**
	 * Loads every registered store at once.
	 */
	public async load() {
		const loading: Promise<unknown>[] = [];
		for (const store of this.values() as IterableIterator<Store<Piece>>) {
			loading.push(store.loadAll());
		}

		await Promise.all(loading);
	}

	/**
	 * Points every registered store at `<rootDirectory>/<storeName>`.
	 *
	 * With the conventional layout below, running `bun run src/index.ts` registers
	 * `/home/me/my-bot/src/commands` for the commands store and `/home/me/my-bot/src/listeners` for
	 * the listeners store, because the root is the directory of the running entrypoint.
	 *
	 * ```
	 * /home/me/my-bot
	 * ├─ src
	 * │  ├─ commands
	 * │  ├─ listeners
	 * │  └─ index.ts
	 * └─ package.json
	 * ```
	 *
	 * A path is registered for every store whether or not the folder exists, so a folder created
	 * later can still be picked up by a reload.
	 *
	 * @param rootDirectory The directory holding the per-store folders. Defaults to the project root.
	 */
	public registerPath(rootDirectory: PathLike = getRootData().root) {
		const root = resolvePath(rootDirectory);
		for (const store of this.values() as IterableIterator<Store<Piece>>) {
			store.registerPath(join(root, store.name));
		}
	}

	/**
	 * Registers a store so the registry manages it.
	 *
	 * @remarks
	 * Once registered, {@link StoreRegistry.registerPath}, {@link StoreRegistry.load} and
	 * {@link StoreRegistry.loadPiece} all reach the store. Register as early as possible — a store
	 * registered after those have run has to be driven by hand.
	 *
	 * Any pieces queued for this store through {@link StoreRegistry.loadPiece} are handed over here.
	 * They are not loaded yet; that happens on the store's next {@link Store.loadAll}.
	 *
	 * @param store The store to register.
	 */
	public register<T extends Piece>(store: Store<T>): this {
		this.set(
			store.name as StoreRegistryKey,
			store as unknown as StoreRegistryValue,
		);

		const queued = this.#pending.get(store.name);
		if (queued) {
			for (const entry of queued) {
				store[ManuallyRegisteredPieces].set(entry.name, entry);
			}

			this.#pending.delete(store.name);
		}

		return this;
	}

	/**
	 * Stops the registry from managing a store.
	 *
	 * @param store The store to remove.
	 */
	public deregister<T extends Piece>(store: Store<T>): this {
		this.delete(store.name as StoreRegistryKey);
		return this;
	}

	/**
	 * Registers a piece against a store by name, without it existing as a file.
	 *
	 * If the store is already registered the call is forwarded to it. If it is not, the piece waits
	 * in a queue until that store registers — naming an unknown store is not an error.
	 *
	 * @remarks
	 * - The piece's root and path are both the virtual path, so it can never be reloaded.
	 * - Useful where the file system is unavailable or read-only, such as serverless deployments.
	 * - Nothing is registered if validation fails — the operation either fully succeeds or throws.
	 *
	 * @param entry The store name, piece name and class to register.
	 * @throws {TypeError} If `entry.piece` is not a class.
	 *
	 * @see {@link Store.loadPiece}
	 *
	 * @example
	 * ```typescript
	 * import { container } from "kairojs";
	 *
	 * class PingCommand extends Command {
	 *   // ...
	 * }
	 *
	 * container.stores.loadPiece({
	 *   store: "commands",
	 *   name: "ping",
	 *   piece: PingCommand
	 * });
	 * ```
	 */
	public async loadPiece<StoreName extends StoreRegistryKey>(
		entry: StoreRegistryManuallyRegisteredPiece<StoreName>,
	) {
		// The typed overload resolves this to the exact store `entry.store` names. It is declared
		// non-optional there because a registered name always maps to a store, but a caller may name one
		// that has not been registered yet, so widen it back to include `undefined`.
		const store: StoreOf<StoreName> | undefined = this.get(entry.store);

		if (store) {
			// `store` is the union of every registered store here, so its `loadPiece` parameter narrows to
			// the intersection of all of theirs. At runtime the store and the entry always agree, because
			// both are keyed by the same `entry.store` name.
			await (store as unknown as Store<Piece, StoreName>).loadPiece(entry);
			return;
		}

		if (!isClass(entry.piece)) {
			throw new TypeError(
				`The piece ${entry.name} is not a Class. ${String(entry.piece)}`,
			);
		}

		// `piece` is typed against the specific store this entry names, while the pending queue holds
		// entries for every store; the cast reconciles the two without widening the public signature.
		this.#pending
			.ensure(entry.store, () => [])
			.push({ name: entry.name, piece: entry.piece } as never);
	}
}
