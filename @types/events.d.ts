import type {
	ApplicationCommand,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	Collection,
	ContextMenuCommandInteraction,
	Interaction,
	Message,
	RestEvents,
	Snowflake,
} from "discord.js";
import type { Events as KairoEvents } from "@/constants/events.ts";
import type { UserError } from "@/errors/user-error.ts";
import type { Piece } from "@/loader/piece.ts";
import type { Store } from "@/loader/store.ts";
import type { Command } from "@/structures/command.ts";
import type { InteractionHandler } from "@/structures/interaction-handler.ts";
import type { AnyListener } from "./listener.d.ts";
import type { ApplicationCommandRegistry } from "@/application-commands/registry.ts";
import type { None, Option, Some } from "./utilities/result.d.ts";
import type { PluginHook } from "./constants.d.ts";
import type {
	AutocompleteCommand,
	AutocompleteCommandRunContext,
	ChatInputCommand,
	ChatInputCommandRunContext,
	ContextMenuCommand,
	ContextMenuCommandRunContext,
	MessageCommand,
	MessageCommandRunContext,
} from "./commands.d.ts";

/* -------------------------------------------------------------------------- */
/*                              Event sources                                  */
/* -------------------------------------------------------------------------- */

/**
 * The events a bot defines for itself.
 *
 * This interface is deliberately empty. Augment it to describe your own events, and a listener
 * declared with `type: "custom"` will then have its arguments fully inferred:
 *
 * @example
 * ```typescript
 * declare module "kairojs" {
 *   interface CustomEvents {
 *     memberVerified: [member: GuildMember, method: "captcha" | "manual"];
 *     shopPurchase: [userId: string, itemId: string, price: number];
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
// biome-ignore lint/complexity/noBannedTypes: the empty object is deliberate — consumers augment this type
export type CustomEvents = {};

/**
 * Where an event comes from.
 *
 * A listener names one of these, and the event names and argument tuples available to it follow
 * from that choice alone — there is no single flat namespace in which a REST event and a gateway
 * event could be confused for one another.
 *
 * @since 1.0.0
 */
export type EventType = "client" | "rest" | "custom";

/**
 * Resolves an event source to the events that source can emit.
 *
 * When `CustomEvents` has not been augmented it would otherwise resolve to `never`, which produces
 * an unreadable error at the use site; the guard below substitutes a placeholder whose key names the
 * actual problem instead.
 *
 * @since 1.0.0
 */
export type EventMap<T extends EventType> = T extends "client"
	? ClientEvents
	: T extends "rest"
		? RestEvents
		: keyof CustomEvents extends never
			? {
					"no custom events have been declared — augment the CustomEvents interface": [];
				}
			: CustomEvents;

/**
 * Every event name valid for a source.
 *
 * This maps over `T` before taking `keyof`, which matters when `T` is a union rather than a single
 * source: `keyof (A | B)` keeps only the keys A and B share — for unrelated event maps, none — so a
 * naive `keyof EventMap<T>` collapses to `never` and makes the whole generic unusable. Distributing
 * first and unioning after gives every name any of the sources accepts, while still narrowing to
 * exactly one source's names when `T` is a single source.
 *
 * @since 1.0.0
 */
export type EventNameFor<T extends EventType> = {
	[Source in T]: keyof EventMap<Source>;
}[T];

/**
 * Resolves an event source and name to the tuple of arguments its listener receives.
 *
 * This is what removes the need for a hand-written payload interface per event: the tuple is read
 * straight out of the source's event map. The `& keyof EventMap<Source>` intersection keeps the
 * lookup valid when `T` is a union, where a given name belongs to only one of the sources.
 *
 * @since 1.0.0
 */
export type EventArgs<T extends EventType, K extends EventNameFor<T>> = {
	[Source in T]: Extract<
		EventMap<Source>[K & keyof EventMap<Source>],
		unknown[]
	>;
}[T];

/* -------------------------------------------------------------------------- */
/*                            Event payload shapes                             */
/* -------------------------------------------------------------------------- */

export interface PieceErrorPayload {
	piece: Piece;
}

export interface ListenerErrorPayload extends PieceErrorPayload {
	piece: AnyListener;
}

export interface UnknownMessageCommandNamePayload {
	message: Message;
	prefix: string | RegExp;
	commandPrefix: string;
}

export interface CommandDoesNotHaveMessageCommandHandlerPayload {
	message: Message;
	prefix: string | RegExp;
	commandPrefix: string;
	command: Command;
}

export interface UnknownMessageCommandPayload
	extends UnknownMessageCommandNamePayload {
	commandName: string;
}

export interface BaseMessageCommandPayload {
	message: Message;
	command: MessageCommand;
}

export interface PreMessageCommandRunPayload
	extends MessageCommandDeniedPayload {}

export interface MessageCommandDeniedPayload extends BaseMessageCommandPayload {
	parameters: string;
	context: MessageCommandRunContext;
}

export interface MessageCommandAcceptedPayload
	extends BaseMessageCommandPayload {
	parameters: string;
	context: MessageCommandRunContext;
}

export interface MessageCommandRunPayload
	extends MessageCommandAcceptedPayload {
	args: unknown;
}

export interface MessageCommandFinishPayload extends MessageCommandRunPayload {
	success: boolean;
	duration: number;
}

export interface MessageCommandErrorPayload extends MessageCommandRunPayload {
	duration: number;
}

export interface MessageCommandSuccessPayload extends MessageCommandRunPayload {
	result: unknown;
	duration: number;
}

export interface MessageCommandTypingErrorPayload
	extends MessageCommandRunPayload {}

export interface UnknownChatInputCommandPayload {
	interaction: ChatInputCommandInteraction;
	context: ChatInputCommandRunContext;
}

export interface CommandDoesNotHaveChatInputCommandHandlerPayload {
	interaction: ChatInputCommandInteraction;
	command: Command;
	context: ChatInputCommandRunContext;
}

export interface BaseChatInputCommandPayload {
	interaction: ChatInputCommandInteraction;
	command: ChatInputCommand;
}

export interface PreChatInputCommandRunPayload
	extends BaseChatInputCommandPayload {
	context: ChatInputCommandRunContext;
}

export interface ChatInputCommandDeniedPayload
	extends BaseChatInputCommandPayload {
	context: ChatInputCommandRunContext;
}

export interface ChatInputCommandAcceptedPayload
	extends PreChatInputCommandRunPayload {}

export interface ChatInputCommandRunPayload
	extends ChatInputCommandAcceptedPayload {}

export interface ChatInputCommandFinishPayload
	extends ChatInputCommandAcceptedPayload {
	success: boolean;
	duration: number;
}

export interface ChatInputCommandSuccessPayload
	extends ChatInputCommandRunPayload {
	result: unknown;
	duration: number;
}

export interface ChatInputCommandErrorPayload
	extends BaseChatInputCommandPayload {
	duration: number;
}

export interface UnknownContextMenuCommandPayload {
	interaction: ContextMenuCommandInteraction;
	context: ContextMenuCommandRunContext;
}

export interface CommandDoesNotHaveContextMenuCommandHandlerPayload {
	interaction: ContextMenuCommandInteraction;
	context: ContextMenuCommandRunContext;
	command: Command;
}

export interface BaseContextMenuCommandPayload {
	interaction: ContextMenuCommandInteraction;
	command: ContextMenuCommand;
}

export interface PreContextMenuCommandRunPayload
	extends BaseContextMenuCommandPayload {
	context: ContextMenuCommandRunContext;
}

export interface ContextMenuCommandDeniedPayload
	extends BaseContextMenuCommandPayload {
	context: ContextMenuCommandRunContext;
}

export interface ContextMenuCommandAcceptedPayload
	extends PreContextMenuCommandRunPayload {}

export interface ContextMenuCommandRunPayload
	extends ContextMenuCommandAcceptedPayload {}

export interface ContextMenuCommandFinishPayload
	extends ContextMenuCommandAcceptedPayload {
	success: boolean;
	duration: number;
}

export interface ContextMenuCommandSuccessPayload
	extends ContextMenuCommandRunPayload {
	result: unknown;
	duration: number;
}

export interface ContextMenuCommandErrorPayload
	extends BaseContextMenuCommandPayload {
	duration: number;
}

export interface BaseInteractionHandlerPayload {
	interaction: Interaction;
	handler: InteractionHandler;
}

export interface InteractionHandlerParseSuccess
	extends BaseInteractionHandlerPayload {}

export interface InteractionHandlerParseSome<T = unknown>
	extends BaseInteractionHandlerPayload {
	/**
	 * The value that was passed to the `some` function.
	 */
	value: T;
}

export interface InteractionHandlerParseNone
	extends BaseInteractionHandlerPayload {}

export interface InteractionHandlerParseError
	extends BaseInteractionHandlerPayload {}

export interface InteractionHandlerError
	extends BaseInteractionHandlerPayload {}

export interface AutocompleteInteractionPayload {
	interaction: AutocompleteInteraction;
	command: AutocompleteCommand;
	context: AutocompleteCommandRunContext;
}
/* -------------------------------------------------------------------------- */
/*                        Kairo's own client events                            */
/* -------------------------------------------------------------------------- */

/**
 * Kairo emits its own lifecycle events on the discord.js client, so they are declared here rather
 * than in a parallel map. This is the one module augmentation that survives the merge, because
 * discord.js remains an external package.
 *
 * Note there is deliberately no catch-all index signature: every valid event name is declared, so a
 * misspelled one fails to compile instead of silently never firing. Events a bot defines itself
 * belong in `CustomEvents` with `type: "custom"`.
 */
declare module "discord.js" {
	interface ClientEvents {
		// Piece lifecycle
		[KairoEvents.PieceUnload]: [store: Store<Piece>, piece: Piece];
		[KairoEvents.PiecePostLoad]: [store: Store<Piece>, piece: Piece];
		[KairoEvents.ListenerError]: [
			error: unknown,
			payload: ListenerErrorPayload,
		];
		[KairoEvents.CommandApplicationCommandRegistryError]: [
			error: unknown,
			command: Command,
		];
		[KairoEvents.ApplicationCommandRegistriesInitialising]: [];
		[KairoEvents.ApplicationCommandRegistriesRegistered]: [
			registries: Map<string, ApplicationCommandRegistry>,
			timeTaken: number,
		];
		[KairoEvents.ApplicationCommandRegistriesBulkOverwrite]: [
			result: Collection<Snowflake, ApplicationCommand>,
			guildId: string | null,
		];
		[KairoEvents.ApplicationCommandRegistriesBulkOverwriteError]: [
			error: unknown,
			guildId: string | null,
		];
		[KairoEvents.PreMessageParsed]: [message: Message];
		[KairoEvents.MentionPrefixOnly]: [message: Message];
		[KairoEvents.NonPrefixedMessage]: [message: Message];
		[KairoEvents.PrefixedMessage]: [message: Message, prefix: string | RegExp];
		[KairoEvents.UnknownMessageCommandName]: [
			payload: UnknownMessageCommandNamePayload,
		];
		[KairoEvents.UnknownMessageCommand]: [
			payload: UnknownMessageCommandPayload,
		];
		[KairoEvents.CommandDoesNotHaveMessageCommandHandler]: [
			payload: CommandDoesNotHaveMessageCommandHandlerPayload,
		];
		[KairoEvents.PreMessageCommandRun]: [payload: PreMessageCommandRunPayload];
		[KairoEvents.MessageCommandDenied]: [
			error: UserError,
			payload: MessageCommandDeniedPayload,
		];
		[KairoEvents.MessageCommandAccepted]: [
			payload: MessageCommandAcceptedPayload,
		];
		[KairoEvents.MessageCommandRun]: [
			message: Message,
			command: Command,
			payload: MessageCommandRunPayload,
		];
		[KairoEvents.MessageCommandSuccess]: [
			payload: MessageCommandSuccessPayload,
		];
		[KairoEvents.MessageCommandError]: [
			error: unknown,
			payload: MessageCommandErrorPayload,
		];
		[KairoEvents.MessageCommandFinish]: [
			message: Message,
			command: Command,
			payload: MessageCommandFinishPayload,
		];
		[KairoEvents.MessageCommandTypingError]: [
			error: Error,
			payload: MessageCommandTypingErrorPayload,
		];
		[KairoEvents.PluginLoaded]: [hook: PluginHook, name: string | undefined];
		[KairoEvents.InteractionHandlerParseSuccess]: [
			option: Option<unknown>,
			payload: InteractionHandlerParseSuccess,
		];
		[KairoEvents.InteractionHandlerParseSome]: [
			option: Some<unknown>,
			payload: InteractionHandlerParseSome,
		];
		[KairoEvents.InteractionHandlerParseNone]: [
			option: None,
			payload: InteractionHandlerParseNone,
		];
		[KairoEvents.InteractionHandlerParseError]: [
			error: unknown,
			payload: InteractionHandlerParseError,
		];
		[KairoEvents.InteractionHandlerError]: [
			error: unknown,
			payload: InteractionHandlerError,
		];
		[KairoEvents.PossibleAutocompleteInteraction]: [
			interaction: AutocompleteInteraction,
		];
		[KairoEvents.CommandAutocompleteInteractionError]: [
			error: unknown,
			payload: AutocompleteInteractionPayload,
		];
		[KairoEvents.CommandAutocompleteInteractionSuccess]: [
			payload: AutocompleteInteractionPayload,
		];
		// Chat input command chain
		[KairoEvents.PossibleChatInputCommand]: [
			interaction: ChatInputCommandInteraction,
		];
		[KairoEvents.UnknownChatInputCommand]: [
			payload: UnknownChatInputCommandPayload,
		];
		[KairoEvents.CommandDoesNotHaveChatInputCommandHandler]: [
			payload: CommandDoesNotHaveChatInputCommandHandlerPayload,
		];
		[KairoEvents.PreChatInputCommandRun]: [
			payload: PreChatInputCommandRunPayload,
		];
		[KairoEvents.ChatInputCommandDenied]: [
			error: UserError,
			payload: ChatInputCommandDeniedPayload,
		];
		[KairoEvents.ChatInputCommandAccepted]: [
			payload: ChatInputCommandAcceptedPayload,
		];
		[KairoEvents.ChatInputCommandRun]: [
			interaction: ChatInputCommandInteraction,
			command: ChatInputCommand,
			payload: ChatInputCommandRunPayload,
		];
		[KairoEvents.ChatInputCommandSuccess]: [
			payload: ChatInputCommandSuccessPayload,
		];
		[KairoEvents.ChatInputCommandError]: [
			error: unknown,
			payload: ChatInputCommandErrorPayload,
		];
		[KairoEvents.ChatInputCommandFinish]: [
			interaction: ChatInputCommandInteraction,
			command: ChatInputCommand,
			payload: ChatInputCommandFinishPayload,
		];
		// Context menu command chain
		[KairoEvents.PossibleContextMenuCommand]: [
			interaction: ContextMenuCommandInteraction,
		];
		[KairoEvents.UnknownContextMenuCommand]: [
			payload: UnknownContextMenuCommandPayload,
		];
		[KairoEvents.CommandDoesNotHaveContextMenuCommandHandler]: [
			payload: CommandDoesNotHaveContextMenuCommandHandlerPayload,
		];
		[KairoEvents.PreContextMenuCommandRun]: [
			payload: PreContextMenuCommandRunPayload,
		];
		[KairoEvents.ContextMenuCommandDenied]: [
			error: UserError,
			payload: ContextMenuCommandDeniedPayload,
		];
		[KairoEvents.ContextMenuCommandAccepted]: [
			payload: ContextMenuCommandAcceptedPayload,
		];
		[KairoEvents.ContextMenuCommandRun]: [
			interaction: ContextMenuCommandInteraction,
			command: ContextMenuCommand,
			payload: ContextMenuCommandRunPayload,
		];
		[KairoEvents.ContextMenuCommandSuccess]: [
			payload: ContextMenuCommandSuccessPayload,
		];
		[KairoEvents.ContextMenuCommandError]: [
			error: unknown,
			payload: ContextMenuCommandErrorPayload,
		];
		[KairoEvents.ContextMenuCommandFinish]: [
			interaction: ContextMenuCommandInteraction,
			command: ContextMenuCommand,
			payload: ContextMenuCommandFinishPayload,
		];
	}
}
