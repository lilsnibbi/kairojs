import type { Container } from "@types";
import { StoreRegistry } from "@/loader/store-registry.ts";

/**
 * The shared service bag every piece can reach through `this.container`.
 *
 * Kairo is a standalone framework, so there has to be one agreed place to hand objects between
 * unrelated parts of a bot — the client, the logger, a database handle, anything a plugin wants to
 * expose. Assigning a property here makes it visible everywhere at once.
 *
 * Add your own properties by augmenting the `Container` interface.
 *
 * @example
 * ```typescript
 * import { container } from "kairojs";
 *
 * container.version = "1.0.0";
 *
 * declare module "kairojs" {
 *   interface Container {
 *     version: string;
 *   }
 * }
 *
 * // Anywhere else, in any piece:
 * export class PingCommand extends Command {
 *   public messageRun(message: Message) {
 *     const { version } = this.container;
 *     return message.reply(`Running v${version}.`);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export const container = {
	stores: new StoreRegistry(),
	// `client`, `logger` and `applicationCommandRegistries` are filled in by the client as it starts
	// up — `client` first thing in its constructor, before any hook or piece can observe the
	// container. Declaring them here would mean inventing placeholder values that are never read, so
	// the assertion states what is true by the time anything reaches this object.
} as Container;
