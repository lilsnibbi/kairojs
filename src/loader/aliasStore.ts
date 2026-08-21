import { Collection } from "discord.js";
import type { StoreRegistryKey } from "@types";
import type { AliasPiece } from "./aliasPiece.ts";
import { Store } from "./store.ts";

/**
 * A {@link Store} whose pieces can also be reached by their aliases.
 *
 * Lookups check the piece's own name first and fall back to the alias table, so a command declaring
 * `aliases: ["pong"]` is retrievable under both `"ping"` and `"pong"`.
 *
 * @since 1.0.0
 */
export class AliasStore<
	T extends AliasPiece,
	StoreName extends StoreRegistryKey = StoreRegistryKey,
> extends Store<T, StoreName> {
	/**
	 * Every alias currently pointing at a piece in this store.
	 */
	public readonly aliases = new Collection<string, T>();

	/**
	 * Looks up a piece by name, falling back to the alias table.
	 *
	 * @param key The name or alias to look for.
	 */
	public override get(key: string): T | undefined {
		return super.get(key) ?? this.aliases.get(key);
	}

	/**
	 * Whether a name or alias resolves to a piece in this store.
	 *
	 * @param key The name or alias to check.
	 */
	public override has(key: string): boolean {
		return super.has(key) || this.aliases.has(key);
	}

	/**
	 * Removes a piece and every alias still pointing at it.
	 *
	 * @param name The piece, or the name it is stored under.
	 * @returns The piece that was removed.
	 */
	public override unload(name: string | T): Promise<T> {
		const piece = this.resolve(name);

		for (const alias of piece.aliases) {
			// Another piece may have claimed this alias since; only drop the ones still ours.
			if (this.aliases.get(alias) === piece) this.aliases.delete(alias);
		}

		return super.unload(piece);
	}

	/**
	 * Stores a piece and registers each of its aliases.
	 *
	 * @param piece The piece to insert.
	 * @returns The same piece.
	 */
	public override async insert(piece: T) {
		for (const alias of piece.aliases) {
			this.aliases.set(alias, piece);
		}

		return super.insert(piece);
	}
}
