/**
 * Registers every listener Kairo needs in order to function at all.
 *
 * Each module registers its own piece as a side effect of being imported, so this barrel exports
 * nothing. Between them these listeners form the interaction pipeline: the gateway event is fanned
 * out, each kind is resolved to a command, its preconditions are run, and the command is invoked.
 *
 * The listener sets under `optional-listeners` are the ones a bot can switch off; the ones here are
 * not, because without them nothing would route.
 *
 * @since 1.0.0
 */

import "./chat-input-command-accepted.ts";
import "./context-menu-command-accepted.ts";
import "./interaction-create.ts";
import "./possible-autocomplete-interaction.ts";
import "./possible-chat-input-command.ts";
import "./possible-context-menu-command.ts";
import "./pre-chat-input-command-run.ts";
import "./pre-context-menu-command-run.ts";
import "./ready.ts";
import "./chat-input-subcommand-error.ts";
import "./chat-input-subcommand-no-match.ts";
import "./message-subcommand-error.ts";
import "./message-subcommand-no-match.ts";
import "./subcommand-mapping-missing-chat-input-handler.ts";
import "./subcommand-mapping-missing-message-handler.ts";
import "./pattern-command-message-parse.ts";
import "./pattern-command-pre-run.ts";
import "./pattern-command-accepted.ts";
