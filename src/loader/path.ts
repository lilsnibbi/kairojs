import type { PathLike } from "@types";

/**
 * Normalises a path that may be either a string or a `file:` URL down to a plain string path.
 *
 * @param path The path to normalise.
 * @returns The path as a string.
 *
 * @since 1.0.0
 */
export function resolvePath(path: PathLike): string {
	return typeof path === "string" ? path : Bun.fileURLToPath(path);
}
