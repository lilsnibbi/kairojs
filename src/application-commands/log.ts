import { container } from "@/container.ts";

/**
 * Writes an error from the bulk-overwrite pass, tagged so it can be told apart from the per-command
 * registry logs that share the same run.
 *
 * @param message What went wrong.
 * @param other Anything else worth attaching, such as the error itself.
 *
 * @since 1.0.0
 */
export function bulkOverwriteError(message: string, ...other: unknown[]) {
	container.logger.error(
		`ApplicationCommandRegistries(BulkOverwrite) ${message}`,
		...other,
	);
}

/**
 * Writes a warning from the bulk-overwrite pass, tagged so it can be told apart from the per-command
 * registry logs that share the same run.
 *
 * @param message What is worth flagging.
 * @param other Anything else worth attaching.
 *
 * @since 1.0.0
 */
export function bulkOverwriteWarn(message: string, ...other: unknown[]) {
	container.logger.warn(
		`ApplicationCommandRegistries(BulkOverwrite) ${message}`,
		...other,
	);
}

/**
 * Writes a debug line from the bulk-overwrite pass, tagged so it can be told apart from the
 * per-command registry logs that share the same run.
 *
 * @param message What happened.
 * @param other Anything else worth attaching.
 *
 * @since 1.0.0
 */
export function bulkOverwriteDebug(message: string, ...other: unknown[]) {
	container.logger.debug(
		`ApplicationCommandRegistries(BulkOverwrite) ${message}`,
		...other,
	);
}
