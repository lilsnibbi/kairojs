/**
 * Kairo's public entrypoint.
 *
 * Everything exported here is a runtime value — classes, functions and frozen constants. Types are
 * published separately from the `@types` tree, which is what `package.json`'s `types` field points
 * at, so a source file never exports a type and a consumer never has to reach into `src` for one.
 *
 * ```typescript
 * import { Command, KairoClient, container } from "kairojs";
 * import type { CommandOptions } from "kairojs";
 * ```
 *
 * The subpath exports — `kairojs/i18n`, `kairojs/hmr`, `kairojs/logger` and `kairojs/utilities/*` —
 * cover the parts a bot opts into rather than gets by default.
 *
 * @since 1.0.0
 */

// The client and the shared container.
export * from "./client.ts";
export * from "./container.ts";

// Constants: events, identifiers and the frozen option enums.
export * from "./constants/index.ts";

// Errors raised by the framework.
export * from "./errors/index.ts";

// The piece loader: pieces, stores, the registry and the loading strategy.
export * from "./loader/index.ts";

// Piece structures a bot subclasses.
export * from "./structures/index.ts";

// Argument parsing.
export * from "./parsers/index.ts";
export * from "./resolvers/index.ts";

// Preconditions and the containers that compose them.
export * from "./preconditions/resolvers/index.ts";
export * from "./preconditions/containers/index.ts";

// Application command registration.
export * from "./applicationCommands/index.ts";

import {
	acquire,
	getBulkOverwriteRetries,
	getDefaultBehaviorWhenNotIdentical,
	getDefaultGuildIds,
	registries,
	setBulkOverwriteRetries,
	setDefaultBehaviorWhenNotIdentical,
	setDefaultGuildIds,
} from "./applicationCommands/registries.ts";
import type { ApplicationCommandRegistry } from "@types";

/**
 * The application-command registry controls, grouped under one namespace.
 *
 * These are also exported individually; this grouping exists so a bot can adjust registration
 * behaviour without pulling seven loose names into scope.
 *
 * @example
 * ```typescript
 * import { ApplicationCommandRegistries, RegisterBehavior } from "kairojs";
 *
 * ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
 * ```
 *
 * @since 1.0.0
 */
const ApplicationCommandRegistries = {
	acquire,
	setDefaultBehaviorWhenNotIdentical,
	setDefaultGuildIds,
	setBulkOverwriteRetries,
	getDefaultGuildIds,
	getDefaultBehaviorWhenNotIdentical,
	getBulkOverwriteRetries,

	/**
	 * Every registry currently held, keyed by command name. Read-only: acquire a registry through
	 * {@link ApplicationCommandRegistries.acquire} rather than inserting into this map.
	 */
	get registries(): ReadonlyMap<string, ApplicationCommandRegistry> {
		return registries;
	},
};

export { ApplicationCommandRegistries };

// The plugin lifecycle.
export * from "./plugin/index.ts";

// Editable message commands: `send`/`reply` plus the listener that re-runs an edited invocation.
export * from "./editableCommands/index.ts";

// The logger, also available on its own at `kairojs/logger`.
export * from "./logger/index.ts";
