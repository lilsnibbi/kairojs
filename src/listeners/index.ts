/**
 * Registers every listener Kairo needs in order to function at all.
 *
 * Each module registers its own piece as a side effect of being imported, so this barrel exports
 * nothing. Between them these listeners form the interaction pipeline: the gateway event is fanned
 * out, each kind is resolved to a command, its preconditions are run, and the command is invoked.
 *
 * The listener sets under `optionalListeners` are the ones a bot can switch off; the ones here are
 * not, because without them nothing would route.
 *
 * @since 1.0.0
 */

import "./chatInputCommandAccepted.ts";
import "./contextMenuCommandAccepted.ts";
import "./interactionCreate.ts";
import "./possibleAutocompleteInteraction.ts";
import "./possibleChatInputCommand.ts";
import "./possibleContextMenuCommand.ts";
import "./preChatInputCommandRun.ts";
import "./preContextMenuCommandRun.ts";
import "./ready.ts";
import "./chatInputSubcommandError.ts";
import "./chatInputSubcommandNoMatch.ts";
import "./messageSubcommandError.ts";
import "./messageSubcommandNoMatch.ts";
import "./subcommandMappingMissingChatInputHandler.ts";
import "./subcommandMappingMissingMessageHandler.ts";
import "./patternCommandMessageParse.ts";
import "./patternCommandPreRun.ts";
import "./patternCommandAccepted.ts";
