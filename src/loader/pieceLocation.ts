import { basename, relative } from "node:path";
import type { PieceLocationJSON } from "@types";
import { VirtualPath } from "./constants.ts";

/**
 * Describes where a piece was loaded from, and derives the useful views of that — the path relative
 * to its root, the folders it sat under, and the file name.
 *
 * Manually registered pieces have no file behind them; those report {@link PieceLocation.virtual}
 * as `true` and degrade every derived value accordingly.
 *
 * @since 1.0.0
 */
export class PieceLocation {
	/**
	 * The absolute path to the file the piece came from.
	 */
	public readonly full: string;

	/**
	 * The registered directory the file was discovered under.
	 */
	public readonly root: string;

	/**
	 * @param full The absolute path to the file the piece came from.
	 * @param root The registered directory the file was discovered under.
	 */
	public constructor(full: string, root: string) {
		this.full = full;
		this.root = root;
	}

	/**
	 * Whether this piece was registered by hand rather than discovered on disk.
	 */
	public get virtual() {
		return this.full === VirtualPath;
	}

	/**
	 * The path from {@link PieceLocation.root} down to {@link PieceLocation.full}, always written
	 * with forward slashes so the value is identical across platforms.
	 *
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 *   "/usr/src/app/commands/general/ping.ts",
	 *   "/usr/src/app/commands"
	 * );
	 *
	 * console.log(location.relative);
	 * // → "general/ping.ts"
	 * ```
	 */
	public get relative(): string {
		return this.virtual
			? VirtualPath
			: relative(this.root, this.full).replaceAll("\\", "/");
	}

	/**
	 * The folders sitting between {@link PieceLocation.root} and the file itself.
	 *
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 *   "/usr/src/app/commands/games/multiplayer/connect-four.ts",
	 *   "/usr/src/app/commands"
	 * );
	 *
	 * console.log(location.directories);
	 * // → ["games", "multiplayer"]
	 * ```
	 */
	public get directories(): string[] {
		return this.virtual ? [] : this.relative.split("/").slice(0, -1);
	}

	/**
	 * The file name, extension included.
	 *
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 *   "/usr/src/app/commands/games/multiplayer/connect-four.ts",
	 *   "/usr/src/app/commands"
	 * );
	 *
	 * console.log(location.name);
	 * // → "connect-four.ts"
	 * ```
	 */
	public get name(): string {
		return this.virtual ? VirtualPath : basename(this.full);
	}

	/**
	 * Defines how this location is serialised by `JSON.stringify`.
	 */
	public toJSON(): PieceLocationJSON {
		return {
			directories: this.directories,
			full: this.full,
			name: this.name,
			relative: this.relative,
			root: this.root,
		};
	}
}
