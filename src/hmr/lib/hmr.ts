// `fs.watch` is the one file-system API Bun offers no native replacement for, so it is imported from
// `node:fs` on purpose — the single, deliberate exception to Kairo's ban on that module.
import { watch } from "node:fs";
import { join, relative } from "node:path";
import type { HMROptions } from "@types";
import { Result } from "@utilities/result/index.ts";
import { container } from "@/container.ts";
import type { Piece } from "@/loader/piece.ts";
import type { Store } from "@/loader/store.ts";

/**
 * Watches every registered store directory and reloads individual pieces as their files change.
 *
 * `bun --hot` already reloads modules, but it does so by restarting the process graph, which drops
 * the gateway connection and everything hanging off it. This reloads a single piece in place: the
 * client stays connected, the caches stay warm, and only the edited command, listener or
 * precondition is rebuilt.
 *
 * Watchers are returned so a bot that wants to stop reloading — before a graceful shutdown, say —
 * can close them.
 *
 * @param options Whether to run at all, whether to stay quiet, and how the watchers behave.
 * @returns The watcher for each directory being observed.
 *
 * @example
 * ```typescript
 * import { start } from "kairojs/hmr";
 *
 * if (process.env.NODE_ENV !== "production") start();
 * ```
 *
 * @since 1.0.0
 */
export function start(
	{ enabled = true, silent = false, ...watchOptions }: HMROptions = {
		enabled: true,
	},
) {
	const watchers: ReturnType<typeof watch>[] = [];
	if (!enabled) return watchers;

	if (!silent)
		container.logger.info("[HMR]: Enabled. Watching for piece changes.");

	for (const store of container.stores.values()) {
		// The registry holds every store shape at once; the reload path only ever touches members
		// they all share, so it works against the general piece store.
		const generalStore = store as unknown as Store<Piece>;

		for (const root of generalStore.paths) {
			const outcome = Result.from(() =>
				watch(
					root,
					{ ...watchOptions, recursive: true },
					(_event, fileName) => {
						// A missing file name means the platform could not tell us what changed, which
						// leaves nothing to reload.
						if (fileName === null) return;

						const path = join(root, String(fileName));
						coalesce(
							path,
							() => void handleChange(generalStore, root, path, silent),
						);
					},
				),
			);

			outcome.inspect((watcher) => watchers.push(watcher));
			outcome.inspectErr((error) =>
				container.logger.error(
					`[HMR]: Could not watch '${root}' for changes.`,
					error,
				),
			);
		}
	}

	return watchers;
}

/**
 * How long events for the same file are collected before it is acted on, in milliseconds.
 *
 * Saving a file produces several events — editors write, truncate and rename in quick succession, and
 * the platform reports each one — so acting on the first would reload the same piece two or three
 * times per save.
 */
const COALESCE_WINDOW = 100;

/**
 * The reload pending for each path, so a fresh event replaces it rather than queuing another.
 */
const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Runs `callback` once the events for `path` have stopped arriving.
 *
 * @param path The file the events concern.
 * @param callback What to do once the file has settled.
 */
function coalesce(path: string, callback: () => void) {
	clearTimeout(pending.get(path));

	pending.set(
		path,
		setTimeout(() => {
			pending.delete(path);
			callback();
		}, COALESCE_WINDOW),
	);
}

/**
 * Decides what a file-system event means for a piece.
 *
 * The watcher reports creations, deletions and renames all as the same event, so the file itself is
 * the only reliable signal: if it is still there the piece is loaded or reloaded, and if it is gone
 * the piece is unloaded.
 *
 * @param store The store the changed file belongs to.
 * @param root The registered directory being watched.
 * @param path The absolute path of the file that changed.
 * @param silent Whether the outcome is announced through the logger.
 */
async function handleChange(
	store: Store<Piece>,
	root: string,
	path: string,
	silent: boolean,
) {
	// Anything the loader would not have loaded in the first place — a `.d.ts`, an unsupported
	// extension, an underscore-prefixed helper — is not a piece and has nothing to reload.
	if (store.strategy.filter(path) === null) return;

	if (await Bun.file(path).exists())
		await handlePieceUpdate(store, root, path, silent);
	else await handlePieceDelete(store, path, silent);
}

/**
 * Unloads the piece a deleted file produced, if the store still holds one.
 */
async function handlePieceDelete(
	store: Store<Piece>,
	path: string,
	silent: boolean,
) {
	const piece = store.find((candidate) => candidate.location.full === path);
	if (!piece) return;

	const outcome = await Result.fromAsync(async () => {
		await piece.unload();
		if (!silent)
			container.logger.info(
				`[HMR]: Unloaded '${piece.name}' from the ${piece.store.name} store.`,
			);
	});

	outcome.inspectErr((error) =>
		container.logger.error(
			`[HMR]: Failed to unload '${piece.name}' from the ${piece.store.name} store.`,
			error,
		),
	);
}

/**
 * Reloads the piece a changed file produced, or loads the file outright when it is new.
 */
async function handlePieceUpdate(
	store: Store<Piece>,
	root: string,
	path: string,
	silent: boolean,
) {
	const existing = store.find((candidate) => candidate.location.full === path);

	const outcome = await Result.fromAsync(async () => {
		if (existing) {
			await existing.reload();
			if (!silent)
				container.logger.info(
					`[HMR]: Reloaded '${existing.name}' in the ${existing.store.name} store.`,
				);
			return;
		}

		const loaded = await store.load(root, relative(root, path));
		if (silent || loaded.length === 0) return;

		const names = loaded.map((piece) => piece.name).join(", ");
		const stores = [...new Set(loaded.map((piece) => piece.store.name))].join(
			", ",
		);
		container.logger.info(
			`[HMR]: Loaded ${names} into the ${stores} store(s).`,
		);
	});

	outcome.inspectErr((error) =>
		container.logger.error(
			`[HMR]: Failed to load pieces from '${path}'.`,
			error,
		),
	);
}
