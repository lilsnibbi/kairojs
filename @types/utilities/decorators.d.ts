import type {
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { DecoratorIdentifiers as DecoratorIdentifiersConstant } from "@utilities/decorators/lib/identifiers.ts";
import type { Command } from "@/structures/command.ts";
import type { Ctor } from "./utilities.d.ts";
import type { ApplicationCommandRegistryRegisterOptions } from "../application-commands.d.ts";
import type { Container, PieceLoaderContext } from "../loader.d.ts";

/* -------------------------------------------------------------------------- */
/*                              Derived constants                              */
/* -------------------------------------------------------------------------- */

/**
 * The identifiers carried by the errors the permission decorators throw.
 *
 * Branching on one of these is the reliable way to tell "this can only run in a server" apart from
 * "you are missing a permission", without matching on the message text.
 *
 * @since 1.0.0
 */
export type DecoratorIdentifiers =
	(typeof DecoratorIdentifiersConstant)[keyof typeof DecoratorIdentifiersConstant];

/* -------------------------------------------------------------------------- */
/*                              Decorator factories                            */
/* -------------------------------------------------------------------------- */

/**
 * Decides whether the method a precondition guards is allowed to run.
 *
 * It receives exactly the arguments the guarded method was called with, and may answer
 * asynchronously. Throwing from here propagates to the caller instead of triggering the fallback.
 *
 * @since 1.0.0
 */
export type FunctionPrecondition = (
	...args: any[]
) => boolean | Promise<boolean>;

/**
 * Produces the value a guarded method resolves with when its precondition answers falsily.
 *
 * It receives the same arguments as the method it stands in for, and is called with the same `this`.
 *
 * @since 1.0.0
 */
export type FunctionFallback = (...args: any[]) => unknown;

/* -------------------------------------------------------------------------- */
/*                               Piece decorators                              */
/* -------------------------------------------------------------------------- */

/**
 * What `ApplyOptions` hands to a callback when the options a piece needs cannot be written down as a
 * literal — because they depend on the client, on a plugin's service, or on where the piece was
 * loaded from.
 *
 * @since 1.0.0
 */
export interface ApplyOptionsCallbackParameters {
	/**
	 * The shared container, already populated by the time any piece is constructed.
	 */
	container: Container;

	/**
	 * The loader context the piece is about to be constructed with.
	 */
	context: PieceLoaderContext;
}

/**
 * Configures the slash command a `RegisterChatInputCommand` decorator registers.
 *
 * The already-constructed command instance is passed alongside the builder, so the registration can
 * reuse the command's own `name` and `description` rather than repeating them.
 *
 * @since 1.0.0
 */
export type ChatInputCommandBuilderCallback<
	CommandType extends Command = Command,
> = (
	builder: SlashCommandBuilder,
	command: ThisType<CommandType> & CommandType,
) =>
	| SlashCommandBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| SlashCommandOptionsOnlyBuilder;

/**
 * Configures the context-menu command a `RegisterMessageContextMenuCommand` or
 * `RegisterUserContextMenuCommand` decorator registers.
 *
 * The command's type is stamped on afterwards, so the callback must not set it itself.
 *
 * @since 1.0.0
 */
export type ContextMenuCommandBuilderCallback<
	CommandType extends Command = Command,
> = (
	builder: ContextMenuCommandBuilder,
	command: ThisType<CommandType> & CommandType,
) => ContextMenuCommandBuilder;

/**
 * A single registration recorded by one of the `Register*Command` decorators, replayed against the
 * registry once the decorated command is constructed.
 *
 * @internal
 * @since 1.0.0
 */
export type CommandRegistration<CommandType extends Command = Command> =
	| {
			type: "RegisterChatInputCommand";
			builderCallback: ChatInputCommandBuilderCallback<CommandType>;
			registryOptions?: ApplicationCommandRegistryRegisterOptions;
	  }
	| {
			type:
				| "RegisterMessageContextMenuCommand"
				| "RegisterUserContextMenuCommand";
			builderCallback: ContextMenuCommandBuilderCallback<CommandType>;
			registryOptions?: ApplicationCommandRegistryRegisterOptions;
	  };

/**
 * The constructor shape the `Register*Command` decorators wrap: anything constructible with a
 * command's own constructor arguments that yields the decorated command.
 *
 * @internal
 * @since 1.0.0
 */
export type CommandConstructor<CommandType extends Command = Command> = Ctor<
	ConstructorParameters<typeof Command>,
	CommandType
>;
