import { ApplicationCommandType } from "discord.js";
import type {
	ApplicationCommandRegistry,
	ApplicationCommandRegistryRegisterOptions,
	ApplyOptionsCallbackParameters,
	ChatInputCommandBuilderCallback,
	CommandConstructor,
	CommandRegistration,
	ContextMenuCommandBuilderCallback,
	Ctor,
	PieceLoaderContext,
	PieceOptions,
} from "@types";
import { container } from "@/container.ts";
import type { Command } from "@/structures/command.ts";
import type { Piece } from "@/loader/piece.ts";
import { createClassDecorator, createProxy } from "./factories.ts";

/**
 * Every registration collected so far for a given command class, keyed by the *original* class so
 * that stacking several decorators keeps appending to one list instead of starting a new one.
 */
const registrationsByCommand = new WeakMap<
	CommandConstructor<any>,
	CommandRegistration<any>[]
>();

/**
 * Maps a proxy back to the class it wraps, so a second decorator applied to an already-proxied class
 * can find the original.
 */
const originalByProxy = new WeakMap<
	CommandConstructor<any>,
	CommandConstructor<any>
>();

/**
 * Maps a class to the single proxy standing in for it, so stacked decorators reuse one wrapper
 * rather than nesting proxies several layers deep.
 */
const proxyByOriginal = new WeakMap<
	CommandConstructor<any>,
	CommandConstructor<any>
>();

/**
 * Supplies a piece's options from the class declaration itself, instead of writing a constructor
 * that forwards them to `super`.
 *
 * The options given here are merged over whatever the store passes in, so anything the loader
 * supplied still applies unless it is named here. Pass a callback instead of a literal when the
 * options depend on something only available at construction time — the client, a plugin's service,
 * or where the piece was loaded from.
 *
 * @param optionsOrCallback The options to apply, or a callback returning them.
 *
 * @example
 * ```typescript
 * import { ApplyOptions } from "kairojs/utilities/decorators";
 * import { Command } from "kairojs";
 * import type { Message } from "discord.js";
 *
 * @ApplyOptions<Command.Options>({
 *   description: "Measure the round trip to Discord",
 *   enabled: true
 * })
 * export class PingCommand extends Command {
 *   public override async messageRun(message: Message) {
 *     const sent = await message.channel.send("Ping?");
 *     return sent.edit(`Pong! Took ${sent.createdTimestamp - message.createdTimestamp}ms.`);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { ApplyOptions } from "kairojs/utilities/decorators";
 * import { Listener } from "kairojs";
 * import { GatewayDispatchEvents, type GatewayMessageDeleteDispatch } from "discord.js";
 *
 * @ApplyOptions<Listener.Options>(({ container }) => ({
 *   emitter: container.client.ws,
 *   event: GatewayDispatchEvents.MessageDelete
 * }))
 * export class RawMessageDeleteListener extends Listener {
 *   public override run(data: GatewayMessageDeleteDispatch["d"]): void {
 *     if (!data.guild_id) return;
 *     // Handle the raw payload.
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function ApplyOptions<Options extends PieceOptions>(
	optionsOrCallback:
		| Options
		| ((parameters: ApplyOptionsCallbackParameters) => Options),
): ClassDecorator {
	return createClassDecorator(
		(target: Ctor<ConstructorParameters<typeof Piece>, Piece>) =>
			createProxy(target, {
				construct: (
					pieceConstructor,
					[context, baseOptions = {}]: [PieceLoaderContext, PieceOptions],
				) =>
					new pieceConstructor(context, {
						...baseOptions,
						...(typeof optionsOrCallback === "function"
							? optionsOrCallback({ container, context })
							: optionsOrCallback),
					}),
			}),
	);
}

/**
 * Registers a slash command from the class declaration, without writing a
 * `registerApplicationCommands` method by hand.
 *
 * The builder callback also receives the constructed command, so the registration can reuse the
 * command's own `name` and `description` rather than repeating them. Any
 * `registerApplicationCommands` the class does define still runs, after the decorators.
 *
 * Several `Register*Command` decorators may be stacked on one class; each adds a registration and
 * they all run in the order written.
 *
 * @param builderCallback Configures the slash command's builder.
 * @param registryOptions Where to register it, and what to do when Discord's copy differs.
 *
 * @example
 * ```typescript
 * import { RegisterChatInputCommand } from "kairojs/utilities/decorators";
 * import { Command } from "kairojs";
 *
 * @RegisterChatInputCommand((builder, command) => builder.setName(command.name).setDescription(command.description))
 * export class GreetCommand extends Command {
 *   public override chatInputRun(interaction: Command.ChatInputCommandInteraction) {
 *     return interaction.reply({ content: "Hi!" });
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { RegisterChatInputCommand } from "kairojs/utilities/decorators";
 * import { Command } from "kairojs";
 *
 * @RegisterChatInputCommand(
 *   (builder) => builder.setName("greet").setDescription("Sends a greeting"),
 *   { idHints: ["737141877803057244"], guildIds: ["737141877803057244"] }
 * )
 * export class GreetCommand extends Command {
 *   public override chatInputRun(interaction: Command.ChatInputCommandInteraction) {
 *     return interaction.reply({ content: "Hi!" });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RegisterChatInputCommand<CommandType extends Command = Command>(
	builderCallback: ChatInputCommandBuilderCallback<CommandType>,
	registryOptions?: ApplicationCommandRegistryRegisterOptions,
): ClassDecorator {
	return createClassDecorator((target: CommandConstructor<CommandType>) =>
		collectRegistration(target, {
			type: "RegisterChatInputCommand",
			builderCallback,
			registryOptions,
		}),
	);
}

/**
 * Registers a message context-menu command — the entry that appears when right-clicking a message —
 * from the class declaration.
 *
 * The command's type is stamped on for you, so the builder callback must not set it. As with
 * {@link RegisterChatInputCommand}, decorators may be stacked and any hand-written
 * `registerApplicationCommands` still runs afterwards.
 *
 * @param builderCallback Configures the context-menu command's builder.
 * @param registryOptions Where to register it, and what to do when Discord's copy differs.
 *
 * @example
 * ```typescript
 * import { RegisterMessageContextMenuCommand } from "kairojs/utilities/decorators";
 * import { Command } from "kairojs";
 * import { ApplicationIntegrationType, InteractionContextType, type MessageContextMenuCommandInteraction } from "discord.js";
 *
 * @RegisterMessageContextMenuCommand((builder, command) =>
 *   builder
 *     .setName(command.name)
 *     .setContexts(InteractionContextType.Guild)
 *     .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
 * )
 * export class QuoteCommand extends Command {
 *   public override contextMenuRun(interaction: MessageContextMenuCommandInteraction) {
 *     return interaction.reply({ content: "Hi!" });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RegisterMessageContextMenuCommand<
	CommandType extends Command = Command,
>(
	builderCallback: ContextMenuCommandBuilderCallback<CommandType>,
	registryOptions?: ApplicationCommandRegistryRegisterOptions,
): ClassDecorator {
	return createClassDecorator((target: CommandConstructor<CommandType>) =>
		collectRegistration(target, {
			type: "RegisterMessageContextMenuCommand",
			builderCallback,
			registryOptions,
		}),
	);
}

/**
 * Registers a user context-menu command — the entry that appears when right-clicking a member — from
 * the class declaration.
 *
 * The command's type is stamped on for you, so the builder callback must not set it. As with
 * {@link RegisterChatInputCommand}, decorators may be stacked and any hand-written
 * `registerApplicationCommands` still runs afterwards.
 *
 * @param builderCallback Configures the context-menu command's builder.
 * @param registryOptions Where to register it, and what to do when Discord's copy differs.
 *
 * @example
 * ```typescript
 * import { RegisterUserContextMenuCommand } from "kairojs/utilities/decorators";
 * import { Command } from "kairojs";
 * import { ApplicationIntegrationType, InteractionContextType, type UserContextMenuCommandInteraction } from "discord.js";
 *
 * @RegisterUserContextMenuCommand((builder) =>
 *   builder
 *     .setName("Greet")
 *     .setContexts(InteractionContextType.Guild)
 *     .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
 * )
 * export class GreetCommand extends Command {
 *   public override contextMenuRun(interaction: UserContextMenuCommandInteraction) {
 *     return interaction.reply({ content: `Hi ${interaction.targetUser}!` });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function RegisterUserContextMenuCommand<
	CommandType extends Command = Command,
>(
	builderCallback: ContextMenuCommandBuilderCallback<CommandType>,
	registryOptions?: ApplicationCommandRegistryRegisterOptions,
): ClassDecorator {
	return createClassDecorator((target: CommandConstructor<CommandType>) =>
		collectRegistration(target, {
			type: "RegisterUserContextMenuCommand",
			builderCallback,
			registryOptions,
		}),
	);
}

/**
 * Records one registration against a command class and returns the proxy that replays it.
 *
 * Decorators apply bottom-up, so the second one to run is handed the proxy the first one produced.
 * Resolving back to the original class keeps every registration in one list and hands out the same
 * proxy each time, which is what allows the decorators to be stacked freely.
 *
 * @param target The class being decorated, which may already be a proxy.
 * @param registration The registration to record.
 */
function collectRegistration<CommandType extends Command>(
	target: CommandConstructor<CommandType>,
	registration: CommandRegistration<CommandType>,
): CommandConstructor<CommandType> {
	const original = originalByProxy.get(target) ?? target;

	const registrations = registrationsByCommand.get(original) ?? [];
	registrations.push(registration);
	registrationsByCommand.set(original, registrations);

	const existingProxy = proxyByOriginal.get(original);
	if (existingProxy) return existingProxy;

	const proxy = createProxy(target, {
		construct(commandConstructor, constructorArguments) {
			const command: CommandType = Reflect.construct(
				commandConstructor,
				constructorArguments,
			);
			const collected = registrationsByCommand.get(
				original,
			) as CommandRegistration<CommandType>[];

			const originalRegister =
				command.registerApplicationCommands?.bind(command);
			command.registerApplicationCommands =
				function registerApplicationCommands(
					registry: ApplicationCommandRegistry,
				) {
					for (const entry of collected) {
						switch (entry.type) {
							case "RegisterChatInputCommand": {
								registry.registerChatInputCommand(
									(builder) => entry.builderCallback(builder, command),
									entry.registryOptions,
								);
								break;
							}

							case "RegisterMessageContextMenuCommand": {
								registry.registerContextMenuCommand(
									(builder) =>
										entry
											.builderCallback(builder, command)
											.setType(ApplicationCommandType.Message),
									entry.registryOptions,
								);
								break;
							}

							case "RegisterUserContextMenuCommand": {
								registry.registerContextMenuCommand(
									(builder) =>
										entry
											.builderCallback(builder, command)
											.setType(ApplicationCommandType.User),
									entry.registryOptions,
								);
								break;
							}
						}
					}

					return originalRegister?.call(this, registry);
				};

			return command;
		},
	});

	originalByProxy.set(proxy, original);
	proxyByOriginal.set(original, proxy);

	return proxy;
}
