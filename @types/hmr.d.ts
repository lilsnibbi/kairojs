/**
 * How hot module replacement watches the bot's piece directories.
 *
 * @since 1.0.0
 */
export interface HMROptions {
	/**
	 * Whether hot reloading runs at all. Left out, it is on — the module only does anything once it
	 * has been started explicitly, so reaching this point already expresses intent.
	 *
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Whether reloads are performed without announcing them through the logger.
	 *
	 * @default false
	 */
	silent?: boolean;

	/**
	 * Whether the watchers keep the process alive on their own.
	 *
	 * @default true
	 */
	persistent?: boolean;

	/**
	 * A signal that closes every watcher when aborted.
	 */
	signal?: AbortSignal;
}

declare module "discord.js" {
	interface ClientOptions {
		/**
		 * How hot module replacement watches the bot's piece directories.
		 */
		hmr?: HMROptions;
	}
}
