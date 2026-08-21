import { resolve } from "node:path";

/**
 * Recursively walks a directory and yields the absolute path of every file within it.
 *
 * This is the single directory walker used across Kairo: the piece loader, the i18n language
 * scanner and any consumer-facing search helper all funnel through it. It is built on
 * {@link Bun.Glob}, so no `readdir` recursion is performed by hand.
 *
 * Symbolic-link directories are not traversed, and dot-files *are* included, which together
 * match the traversal semantics Kairo relies on when discovering pieces.
 *
 * @param directory The directory to walk.
 * @param filter Receives the **file name** — not the full path — and decides whether the file is
 * yielded. Directories are always descended into regardless of this filter.
 * @returns An async iterable of absolute file paths.
 *
 * @example
 * ```typescript
 * for await (const file of walkFiles(new URL("commands", import.meta.url), (name) => name.endsWith(".ts"))) {
 *   console.log(file);
 * }
 * ```
 *
 * @since 1.0.0
 */
export async function* walkFiles(
	directory: string | URL,
	filter: (fileName: string) => boolean = () => true,
): AsyncIterableIterator<string> {
	const cwd =
		typeof directory === "string" ? directory : Bun.fileURLToPath(directory);

	for await (const relativePath of new Bun.Glob("**/*").scan({
		cwd,
		dot: true,
		onlyFiles: true,
		followSymlinks: false,
	})) {
		const fileName = relativePath.slice(
			Math.max(relativePath.lastIndexOf("/"), relativePath.lastIndexOf("\\")) +
				1,
		);
		if (filter(fileName)) yield resolve(cwd, relativePath);
	}
}

/**
 * Walks a directory and yields every file whose name starts with the given text.
 *
 * The comparison is a plain {@link String.startsWith} check — glob wildcards are not supported here.
 *
 * @param directory The directory to walk.
 * @param prefix The text every yielded file name must start with.
 * @returns An async iterable of absolute file paths.
 *
 * @since 1.0.0
 */
export function walkFilesStartingWith(directory: string | URL, prefix: string) {
	return walkFiles(directory, (fileName) => fileName.startsWith(prefix));
}

/**
 * Walks a directory and yields every file whose name ends with the given text.
 *
 * Typically this is a file extension, but any trailing fragment works. The comparison is a plain
 * {@link String.endsWith} check — glob wildcards are not supported here.
 *
 * @param directory The directory to walk.
 * @param suffix The text every yielded file name must end with.
 * @returns An async iterable of absolute file paths.
 *
 * @since 1.0.0
 */
export function walkFilesEndingWith(directory: string | URL, suffix: string) {
	return walkFiles(directory, (fileName) => fileName.endsWith(suffix));
}

/**
 * Walks a directory and yields every file whose name contains the given text.
 *
 * The comparison is a plain {@link String.includes} check — glob wildcards are not supported here.
 *
 * @param directory The directory to walk.
 * @param fragment The text every yielded file name must contain.
 * @returns An async iterable of absolute file paths.
 *
 * @since 1.0.0
 */
export function walkFilesContaining(directory: string | URL, fragment: string) {
	return walkFiles(directory, (fileName) => fileName.includes(fragment));
}

/**
 * Walks a directory and yields every file whose name matches the given regular expression.
 *
 * @param directory The directory to walk.
 * @param pattern The pattern every yielded file name must match.
 * @returns An async iterable of absolute file paths.
 *
 * @since 1.0.0
 */
export function walkFilesMatching(directory: string | URL, pattern: RegExp) {
	return walkFiles(directory, (fileName) => pattern.test(fileName));
}
