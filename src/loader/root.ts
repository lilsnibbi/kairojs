import { dirname } from "node:path";
import type { RootData } from "@types";

let cached: RootData | null = null;

/**
 * Resolves the directory Kairo treats as the root of the bot's source tree, caching the result
 * after the first call.
 *
 * @returns The root data for this project.
 *
 * @since 1.0.0
 */
export function getRootData(): RootData {
	cached ??= parseRootData();
	return cached;
}

/**
 * Works out the root directory of the running project.
 *
 * The root is the directory containing the entrypoint Bun was started with, read straight from
 * {@link Bun.main}. That is the directory whose subfolders {@link StoreRegistry.registerPath} scans
 * for pieces, so for the conventional layout below the root is `src`, and pieces are discovered in
 * `src/commands`, `src/listeners` and so on.
 *
 * ```
 * my-bot
 * ├─ src
 * │  ├─ commands
 * │  ├─ listeners
 * │  └─ index.ts     <- started with `bun run src/index.ts`
 * └─ package.json
 * ```
 *
 * Taking the running entrypoint rather than a manifest field means the root is always the code that
 * is actually executing, and it needs no file system access to work out. If Bun reports no
 * entrypoint — which happens when the runtime is embedded rather than launched from a script — the
 * working directory is used instead.
 *
 * @returns The root data for this project.
 *
 * @since 1.0.0
 */
export function parseRootData(): RootData {
	return { root: Bun.main ? dirname(Bun.main) : process.cwd() };
}
