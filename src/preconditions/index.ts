/**
 * Registers every precondition Kairo ships with.
 *
 * Each module registers its own piece as a side effect of being imported, so this barrel exports
 * nothing — importing it once is what makes `preconditions: ["NSFW"]` and the options that expand
 * into preconditions work, without the checks having to live in the bot's own `preconditions`
 * directory.
 *
 * @since 1.0.0
 */

import "./client-permissions.ts";
import "./cooldown.ts";
import "./enabled.ts";
import "./nsfw.ts";
import "./run-in.ts";
import "./user-permissions.ts";
import "./subcommand-cooldown.ts";
