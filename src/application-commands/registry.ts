import type {
	ApplicationCommandRegistryRegisterOptions,
	CommandDifference,
	InternalAPICall,
	RegisterableChatInputCommand,
	RegisterableContextMenuCommand,
	StoreOf,
} from "@types";
import { isNullishOrEmpty } from "@utilities/utilities/index.ts";
import {
	ApplicationCommandType,
	Collection,
	type ApplicationCommand,
	type ApplicationCommandManager,
	type ChatInputApplicationCommandData,
} from "discord.js";
import {
	InternalRegistryAPIType,
	RegisterBehavior,
} from "@/constants/enums.ts";
import { container } from "@/container.ts";
import {
	getCommandDifferences,
	getCommandDifferencesFast,
} from "./compute-differences/command.ts";
import {
	convertApplicationCommandToApiData,
	normalizeChatInputCommand,
	normalizeContextMenuCommand,
} from "./normalize-inputs.ts";
import {
	allGuildIdsToFetchCommandsFor,
	getDefaultBehaviorWhenNotIdentical,
	getDefaultGuildIds,
} from "./registries.ts";

/**
 * Everything one command wants registered with Discord.
 *
 * A command describes its application commands by calling the register methods here; nothing is
 * sent while that is happening. The calls are queued and only reconciled against Discord once the
 * client is ready, which is what lets Kairo compare what the bot defines against what is already
 * registered and touch the API only when the two actually differ.
 *
 * Every command owns exactly one registry, reachable as `this.applicationCommandRegistry`.
 *
 * @example
 * ```typescript
 * import { Command } from "kairojs";
 *
 * export class PingCommand extends Command {
 *   public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
 *     registry.registerChatInputCommand((builder) =>
 *       builder.setName("ping").setDescription("Checks whether the bot is responsive.")
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class ApplicationCommandRegistry {
	/**
	 * The name of the command this registry belongs to.
	 */
	public readonly commandName: string;

	/**
	 * Every chat input command name and id that resolves to this command.
	 *
	 * This is what the interaction handler looks up, so it deliberately holds names as well as ids.
	 * For ids alone, read {@link ApplicationCommandRegistry.globalChatInputCommandIds} and
	 * {@link ApplicationCommandRegistry.guildIdToChatInputCommandIds}.
	 */
	public readonly chatInputCommands = new Set<string>();

	/**
	 * Every context menu command name and id that resolves to this command.
	 *
	 * This is what the interaction handler looks up, so it deliberately holds names as well as ids.
	 * For ids alone, read {@link ApplicationCommandRegistry.globalContextMenuCommandIds} and
	 * {@link ApplicationCommandRegistry.guildIdToContextMenuCommandIds}.
	 */
	public readonly contextMenuCommands = new Set<string>();

	/**
	 * The guilds whose commands have to be fetched before this registry can be reconciled.
	 */
	public readonly guildIdsToFetch = new Set<string>();

	/**
	 * The ids of the global chat input commands that resolve to this command.
	 */
	public readonly globalChatInputCommandIds = new Set<string>();

	/**
	 * The ids of the global context menu commands that resolve to this command.
	 */
	public readonly globalContextMenuCommandIds = new Set<string>();

	/**
	 * The ids of the chat input commands that resolve to this command, per guild.
	 */
	public readonly guildIdToChatInputCommandIds = new Collection<
		string,
		Set<string>
	>();

	/**
	 * The ids of the context menu commands that resolve to this command, per guild.
	 */
	public readonly guildIdToContextMenuCommandIds = new Collection<
		string,
		Set<string>
	>();

	/**
	 * The registrations queued so far, replayed against Discord once the client is ready.
	 */
	readonly #apiCalls: InternalAPICall[] = [];

	/**
	 * @param commandName The name of the command this registry belongs to.
	 */
	public constructor(commandName: string) {
		this.commandName = commandName;
	}

	/**
	 * The command this registry belongs to, or `undefined` when it has been unloaded.
	 */
	public get command() {
		// The store registry is a plain collection keyed by store name, so its lookup cannot narrow to
		// the store being asked for. The commands store is registered long before this runs.
		return (container.stores.get("commands") as StoreOf<"commands">).get(
			this.commandName,
		);
	}

	/**
	 * The registrations queued so far, as a read-only view.
	 *
	 * @internal
	 */
	public get apiCalls(): readonly InternalAPICall[] {
		return this.#apiCalls;
	}

	/**
	 * Whether anything is queued for registration.
	 *
	 * A registry with nothing queued has no work to do at all — a command may well define no
	 * application commands, or may have been reloaded from a file that no longer declares any.
	 *
	 * @since 1.0.0
	 */
	public hasApiCalls() {
		return this.#apiCalls.length !== 0;
	}

	/**
	 * Discards everything queued so far.
	 *
	 * Reloading a command rebuilds its registrations from scratch, and the old queue has to go first
	 * or a registration the file no longer declares would be replayed anyway.
	 *
	 * @since 1.0.0
	 */
	public clearApiCalls() {
		this.#apiCalls.length = 0;
	}

	/**
	 * Queues a chat input — slash — command for registration.
	 *
	 * @param command A data object, a builder, or a callback handed a fresh builder to configure.
	 * @param options Where to register it and what to do when it differs from the registered copy.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public registerChatInputCommand(
		command: RegisterableChatInputCommand,
		options?: ApplicationCommandRegistryRegisterOptions,
	) {
		const builtData = normalizeChatInputCommand(command);

		this.chatInputCommands.add(builtData.name);

		const guildIdsToRegister = this.getGuildIdsToRegister(options);

		const registerOptions = {
			registerCommandIfMissing: true,
			behaviorWhenNotIdentical: getDefaultBehaviorWhenNotIdentical(),
			guildIds: guildIdsToRegister,
			...(options ?? {}),
		};

		this.#apiCalls.push({
			builtData,
			registerOptions,
			type: InternalRegistryAPIType.ChatInput,
		});

		if (options?.idHints) {
			for (const hint of options.idHints) {
				this.chatInputCommands.add(hint);
			}
		}

		this.processGuildIds(guildIdsToRegister);

		return this;
	}

	/**
	 * Queues a context menu command for registration.
	 *
	 * @param command A data object, a builder, or a callback handed a fresh builder to configure.
	 * @param options Where to register it and what to do when it differs from the registered copy.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public registerContextMenuCommand(
		command: RegisterableContextMenuCommand,
		options?: ApplicationCommandRegistryRegisterOptions,
	) {
		const builtData = normalizeContextMenuCommand(command);

		this.contextMenuCommands.add(builtData.name);

		const guildIdsToRegister = this.getGuildIdsToRegister(options);

		const registerOptions = {
			registerCommandIfMissing: true,
			behaviorWhenNotIdentical: getDefaultBehaviorWhenNotIdentical(),
			guildIds: guildIdsToRegister,
			...(options ?? {}),
		};

		this.#apiCalls.push({
			builtData,
			registerOptions,
			type: InternalRegistryAPIType.ContextMenu,
		});

		if (options?.idHints) {
			for (const hint of options.idHints) {
				this.contextMenuCommands.add(hint);
			}
		}

		this.processGuildIds(guildIdsToRegister);

		return this;
	}

	/**
	 * Points chat input command names at this command without registering anything.
	 *
	 * Names are a poor key — Discord lets a command be renamed and the interaction then arrives
	 * under the new name — so this warns and exists mostly for commands registered outside Kairo.
	 * Prefer {@link ApplicationCommandRegistry.addChatInputCommandIds}.
	 *
	 * @param names The names to claim, as arguments or as arrays.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public addChatInputCommandNames(...names: string[] | string[][]) {
		const flattened = names.flat(Infinity) as string[];

		for (const command of flattened) {
			this.debug(`Registering name "${command}" to internal chat input map`);
			this.warn(
				`Registering the chat input command "${command}" using a name is not recommended.`,
				'Please use the "addChatInputCommandIds" method instead with a command id.',
			);
			this.chatInputCommands.add(command);
		}

		return this;
	}

	/**
	 * Points context menu command names at this command without registering anything.
	 *
	 * Names are a poor key — Discord lets a command be renamed and the interaction then arrives
	 * under the new name — so this warns and exists mostly for commands registered outside Kairo.
	 * Prefer {@link ApplicationCommandRegistry.addContextMenuCommandIds}.
	 *
	 * @param names The names to claim, as arguments or as arrays.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public addContextMenuCommandNames(...names: string[] | string[][]) {
		const flattened = names.flat(Infinity) as string[];

		for (const command of flattened) {
			this.debug(`Registering name "${command}" to internal context menu map`);
			this.warn(
				`Registering the context menu command "${command}" using a name is not recommended.`,
				'Please use the "addContextMenuCommandIds" method instead with a command id.',
			);
			this.contextMenuCommands.add(command);
		}

		return this;
	}

	/**
	 * Points chat input command ids at this command without registering anything.
	 *
	 * Anything that is not a snowflake is still accepted — it has to be, since ids and names share
	 * the same lookup — but it is warned about, because it is almost always a name in disguise.
	 *
	 * @param commandIds The ids to claim, as arguments or as arrays.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public addChatInputCommandIds(...commandIds: string[] | string[][]) {
		const flattened = commandIds.flat(Infinity) as string[];

		for (const entry of flattened) {
			try {
				BigInt(entry);
				this.debug(`Registering id "${entry}" to internal chat input map`);
			} catch {
				this.debug(`Registering name "${entry}" to internal chat input map`);
				this.warn(
					`Registering the chat input command "${entry}" using a name *and* trying to bypass this warning by calling "addChatInputCommandIds" is not recommended.`,
					'Please use the "addChatInputCommandIds" method with a valid command id instead.',
				);
			}
			this.chatInputCommands.add(entry);
		}

		return this;
	}

	/**
	 * Points context menu command ids at this command without registering anything.
	 *
	 * Anything that is not a snowflake is still accepted — it has to be, since ids and names share
	 * the same lookup — but it is warned about, because it is almost always a name in disguise.
	 *
	 * @param commandIds The ids to claim, as arguments or as arrays.
	 * @returns This registry, so calls can be chained.
	 *
	 * @since 1.0.0
	 */
	public addContextMenuCommandIds(...commandIds: string[] | string[][]) {
		const flattened = commandIds.flat(Infinity) as string[];

		for (const entry of flattened) {
			try {
				BigInt(entry);
				this.debug(`Registering id "${entry}" to internal context menu map`);
			} catch {
				this.debug(`Registering name "${entry}" to internal context menu map`);
				this.warn(
					`Registering the context menu command "${entry}" using a name *and* trying to bypass this warning by calling "addContextMenuCommandIds" is not recommended.`,
					'Please use the "addContextMenuCommandIds" method with a valid command id instead.',
				);
			}
			this.contextMenuCommands.add(entry);
		}

		return this;
	}

	/**
	 * Reconciles everything queued on this registry against the commands Discord already has.
	 *
	 * Each queued call is handled independently and in parallel, so one command failing to register
	 * cannot stop the rest; whatever failed is logged once the whole batch has settled.
	 *
	 * @param applicationCommands The application's command manager.
	 * @param globalCommands The application's currently registered global commands.
	 * @param guildCommands The currently registered commands of every guild that was fetched.
	 * @throws When the default behaviour is `BulkOverwrite`, which reconciles every command at once
	 * and must not be mixed with the per-registry path.
	 *
	 * @since 1.0.0
	 */
	public async runApiCalls(
		applicationCommands: ApplicationCommandManager,
		globalCommands: Collection<string, ApplicationCommand>,
		guildCommands: Map<string, Collection<string, ApplicationCommand>>,
	) {
		if (this.#apiCalls.length === 0) {
			// Nothing was queued, which is perfectly normal for a command with no application commands.
			this.trace("No API calls to run, and no command to register");

			return;
		}

		if (
			getDefaultBehaviorWhenNotIdentical() === RegisterBehavior.BulkOverwrite
		) {
			throw new RangeError(
				`"runApiCalls" was called for "${this.commandName}" but the defaultBehaviorWhenNotIdentical is "BulkOverwrite". This should not happen.`,
			);
		}

		this.debug(
			`Preparing to process ${this.#apiCalls.length} possible command registrations / updates...`,
		);

		const results = await Promise.allSettled(
			this.#apiCalls.map((call) =>
				this.handleAPICall(
					applicationCommands,
					globalCommands,
					guildCommands,
					call,
				),
			),
		);

		const errored = results.filter(
			(result) => result.status === "rejected",
		) as PromiseRejectedResult[];

		if (errored.length) {
			this.error(
				`Received ${errored.length} errors while processing command registrations / updates`,
			);

			for (const error of errored) {
				this.error(error.reason.stack ?? error.reason);
			}
		}
	}

	/**
	 * Records that Discord knows a command by this id, filing it under the guild it belongs to or
	 * under the global commands.
	 *
	 * @param type Whether the id belongs to a chat input or a context menu command.
	 * @param id The id Discord assigned.
	 * @param guildId The guild the command lives in, or nothing for a global command.
	 *
	 * @internal
	 * @since 1.0.0
	 */
	public handleIdAddition(
		type: InternalAPICall["type"],
		id: string,
		guildId?: string | null,
	) {
		switch (type) {
			case InternalRegistryAPIType.ChatInput: {
				this.addChatInputCommandIds(id);

				if (guildId) {
					this.guildIdToChatInputCommandIds
						.ensure(guildId, () => new Set())
						.add(id);
				} else {
					this.globalChatInputCommandIds.add(id);
				}
				break;
			}
			case InternalRegistryAPIType.ContextMenu: {
				this.addContextMenuCommandIds(id);

				if (guildId) {
					this.guildIdToContextMenuCommandIds
						.ensure(guildId, () => new Set())
						.add(id);
				} else {
					this.globalContextMenuCommandIds.add(id);
				}
				break;
			}
		}
	}

	/**
	 * Resolves which guilds a registration applies to: the ones it names, else the application-wide
	 * defaults, else none at all — which makes it a global command.
	 *
	 * @param options The options the registration was queued with.
	 */
	private getGuildIdsToRegister(
		options?: ApplicationCommandRegistryRegisterOptions,
	) {
		let guildIdsToRegister: ApplicationCommandRegistryRegisterOptions["guildIds"];

		if (!isNullishOrEmpty(options?.guildIds)) {
			guildIdsToRegister = options!.guildIds;
		} else if (!isNullishOrEmpty(getDefaultGuildIds())) {
			guildIdsToRegister = getDefaultGuildIds();
		}

		return guildIdsToRegister;
	}

	/**
	 * Notes that these guilds have to be fetched before anything can be reconciled — both for this
	 * registry alone and for the application-wide fetch that happens once on start-up.
	 *
	 * @param guildIdsToRegister The guilds the registration applies to.
	 */
	private processGuildIds(
		guildIdsToRegister: ApplicationCommandRegistryRegisterOptions["guildIds"],
	) {
		if (!isNullishOrEmpty(guildIdsToRegister)) {
			for (const id of guildIdsToRegister) {
				this.guildIdsToFetch.add(id);
				allGuildIdsToFetchCommandsFor.add(id);
			}
		}
	}

	/**
	 * Reconciles one queued registration: finds the registered command it corresponds to, and either
	 * compares the two or creates the command outright.
	 *
	 * @param commandsManager The application's command manager.
	 * @param globalCommands The application's currently registered global commands.
	 * @param allGuildsCommands The currently registered commands of every guild that was fetched.
	 * @param apiCall The queued registration to reconcile.
	 */
	private async handleAPICall(
		commandsManager: ApplicationCommandManager,
		globalCommands: Collection<string, ApplicationCommand>,
		allGuildsCommands: Map<string, Collection<string, ApplicationCommand>>,
		apiCall: InternalAPICall,
	) {
		const { builtData, registerOptions } = apiCall;
		const commandName = builtData.name;
		const behaviorIfNotEqual =
			registerOptions.behaviorWhenNotIdentical ??
			getDefaultBehaviorWhenNotIdentical();

		const findCallback = (entry: ApplicationCommand) => {
			// A chat input registration can only ever match a chat input command.
			if (
				apiCall.type === InternalRegistryAPIType.ChatInput &&
				entry.type !== ApplicationCommandType.ChatInput
			)
				return false;

			if (apiCall.type === InternalRegistryAPIType.ContextMenu) {
				// A context menu registration can never match a chat input command.
				if (entry.type === ApplicationCommandType.ChatInput) return false;
				// Message and user entries are distinct, so the exact type has to line up.
				if (apiCall.builtData.type !== entry.type) return false;
			}

			// Id hints win over the name, which is the only way to follow a command that was renamed.
			const isInIdHint = registerOptions.idHints?.includes(entry.id);
			return typeof isInIdHint === "boolean"
				? isInIdHint || entry.name === commandName
				: entry.name === commandName;
		};

		let type: string;

		switch (apiCall.type) {
			case InternalRegistryAPIType.ChatInput:
				type = "chat input";
				break;
			case InternalRegistryAPIType.ContextMenu:
				switch (apiCall.builtData.type) {
					case ApplicationCommandType.Message:
						type = "message context menu";
						break;
					case ApplicationCommandType.User:
						type = "user context menu";
						break;
					default:
						type = "unknown-type context menu";
				}
				break;
			default:
				type = "unknown";
		}

		if (!registerOptions.guildIds?.length) {
			const globalCommand = globalCommands.find(findCallback);

			if (globalCommand) {
				this.debug(
					`Checking if command "${commandName}" is identical with global ${type} command with id "${globalCommand.id}"`,
				);
				this.handleIdAddition(apiCall.type, globalCommand.id);
				await this.handleCommandPresent(
					globalCommand,
					builtData,
					behaviorIfNotEqual,
					null,
				);
			} else if (registerOptions.registerCommandIfMissing ?? true) {
				this.debug(
					`Creating new global ${type} command with name "${commandName}"`,
				);
				await this.createMissingCommand(commandsManager, builtData, type);
			} else {
				this.debug(
					`Doing nothing about missing global ${type} command with name "${commandName}"`,
				);
			}

			return;
		}

		for (const guildId of registerOptions.guildIds) {
			const guildCommands = allGuildsCommands.get(guildId);

			if (!guildCommands) {
				this.debug(
					`There are no commands for guild with id "${guildId}". Will create ${type} command "${commandName}".`,
				);
				await this.createMissingCommand(
					commandsManager,
					builtData,
					type,
					guildId,
				);
				continue;
			}

			const existingGuildCommand = guildCommands.find(findCallback);

			if (existingGuildCommand) {
				this.debug(
					`Checking if guild ${type} command "${commandName}" is identical to command "${existingGuildCommand.id}"`,
				);
				this.handleIdAddition(apiCall.type, existingGuildCommand.id, guildId);
				await this.handleCommandPresent(
					existingGuildCommand,
					builtData,
					behaviorIfNotEqual,
					guildId,
				);
			} else if (registerOptions.registerCommandIfMissing ?? true) {
				this.debug(
					`Creating new guild ${type} command with name "${commandName}" for guild "${guildId}"`,
				);
				await this.createMissingCommand(
					commandsManager,
					builtData,
					type,
					guildId,
				);
			} else {
				this.debug(
					`Doing nothing about missing guild ${type} command with name "${commandName}" for guild "${guildId}"`,
				);
			}
		}
	}

	/**
	 * Decides what to do about a command Discord already has: compare it against the local payload
	 * and, depending on the chosen behaviour, leave it alone, describe the differences, or update it.
	 *
	 * @param applicationCommand The registered command.
	 * @param apiData The payload the bot defines.
	 * @param behaviorIfNotEqual What to do when the two differ.
	 * @param guildId The guild the command lives in, or `null` for a global command.
	 * @throws When `BulkOverwrite` is somehow in play for a single command, which should be
	 * unreachable.
	 */
	private async handleCommandPresent(
		applicationCommand: ApplicationCommand,
		apiData: InternalAPICall["builtData"],
		behaviorIfNotEqual: ReturnType<typeof getDefaultBehaviorWhenNotIdentical>,
		guildId: string | null,
	) {
		if (behaviorIfNotEqual === RegisterBehavior.BulkOverwrite) {
			this.debug(
				`Command "${this.commandName}" has the behaviorIfNotEqual set to "BulkOverwrite" which is invalid. Using defaultBehaviorWhenNotIdentical instead`,
			);

			behaviorIfNotEqual = getDefaultBehaviorWhenNotIdentical();

			if (behaviorIfNotEqual === RegisterBehavior.BulkOverwrite) {
				throw new Error(
					`Invalid behaviorIfNotEqual value ("BulkOverwrite") for command "${this.commandName}", and defaultBehaviorWhenNotIdentical is also "BulkOverwrite". This should not happen.`,
				);
			}
		}

		let differences: CommandDifference[] = [];

		if (behaviorIfNotEqual === RegisterBehavior.VerboseOverwrite) {
			const now = Date.now();

			// Step 0: describe every difference, because they are going to be printed.
			differences = [
				...getCommandDifferences(
					convertApplicationCommandToApiData(applicationCommand),
					apiData,
					guildId !== null,
				),
			];

			this.debug(
				`Took ${Date.now() - now}ms to process differences via computing differences`,
			);

			// Step 1: identical commands need no further work.
			if (!differences.length) {
				this.debug(
					`${guildId ? "Guild command" : "Command"} "${apiData.name}" is identical to command "${applicationCommand.name}" (${
						applicationCommand.id
					})`,
				);
				return;
			}
		}

		// Logging to console still only needs a yes-or-no answer up front; the descriptions come later.
		if (
			behaviorIfNotEqual === RegisterBehavior.Overwrite ||
			behaviorIfNotEqual === RegisterBehavior.LogToConsole
		) {
			const now = Date.now();

			// Step 0: find out whether anything differs at all.
			const areThereDifferences = getCommandDifferencesFast(
				convertApplicationCommandToApiData(applicationCommand),
				apiData,
				guildId !== null,
			);

			this.debug(
				`Took ${Date.now() - now}ms to process differences via fast compute differences`,
			);

			// Step 1: identical commands need no further work.
			if (!areThereDifferences) {
				this.debug(
					`${guildId ? "Guild command" : "Command"} "${apiData.name}" is identical to command "${applicationCommand.name}" (${
						applicationCommand.id
					})`,
				);
				return;
			}
		}

		this.logCommandDifferencesFound(
			applicationCommand,
			behaviorIfNotEqual === RegisterBehavior.LogToConsole,
			differences,
		);

		// Step 2: logging was the whole point, so stop here.
		if (behaviorIfNotEqual === RegisterBehavior.LogToConsole) {
			return;
		}

		// Step 3: bring the registered command in line with the local one.
		try {
			await applicationCommand.edit(apiData as ChatInputApplicationCommandData);
			this.debug(
				`Updated command ${applicationCommand.name} (${applicationCommand.id}) with new api data`,
			);
		} catch (error) {
			this.error(
				`Failed to update command ${applicationCommand.name} (${applicationCommand.id})`,
				error,
			);
		}
	}

	/**
	 * Prints the differences as an indented tree, so a long list stays readable in a terminal.
	 *
	 * @param applicationCommand The registered command the differences are about.
	 * @param logAsWarn Whether to warn rather than write a debug line.
	 * @param differences The differences to print, which may be empty on the fast path.
	 */
	private logCommandDifferencesFound(
		applicationCommand: ApplicationCommand,
		logAsWarn: boolean,
		differences: CommandDifference[],
	) {
		const lines: string[] = [];
		const pad = " ".repeat(5);

		for (const difference of differences) {
			lines.push(
				[
					`└── At path: ${difference.key}`, //
					`${pad}├── Received: ${difference.original}`,
					`${pad}└── Expected: ${difference.expected}`,
					"",
				].join("\n"),
			);
		}

		const trailingNewLine = lines.length ? "\n" : "";
		const header = `Found differences for command "${applicationCommand.name}" (${applicationCommand.id}) versus provided api data.${trailingNewLine}`;

		if (logAsWarn) {
			this.warn(header, ...lines);
		} else {
			this.debug(header, ...lines);
		}
	}

	/**
	 * Creates a command Discord does not have yet, and files the id it hands back.
	 *
	 * The id is logged rather than only stored, because putting it in the registration's `idHints`
	 * is what lets the command survive being renamed later.
	 *
	 * @param commandsManager The application's command manager.
	 * @param apiData The payload to send.
	 * @param type How to describe the command in the log.
	 * @param guildId The guild to create it in, or nothing for a global command.
	 */
	private async createMissingCommand(
		commandsManager: ApplicationCommandManager,
		apiData: InternalAPICall["builtData"],
		type: string,
		guildId?: string,
	) {
		try {
			const result = await commandsManager.create(apiData, guildId);

			this.info(
				`Successfully created ${type}${guildId ? " guild" : ""} command "${apiData.name}" with id "${
					result.id
				}". You should add the id to the "idHints" property of the register method you used!`,
			);

			switch (apiData.type) {
				case undefined:
				case ApplicationCommandType.ChatInput: {
					this.handleIdAddition(
						InternalRegistryAPIType.ChatInput,
						result.id,
						guildId,
					);
					break;
				}
				case ApplicationCommandType.Message:
				case ApplicationCommandType.User: {
					this.handleIdAddition(
						InternalRegistryAPIType.ContextMenu,
						result.id,
						guildId,
					);
					break;
				}
			}
		} catch (error) {
			this.error(
				`Failed to register${guildId ? " guild" : ""} application command with name "${apiData.name}"${
					guildId ? ` for guild "${guildId}"` : ""
				}`,
				error,
			);
		}
	}

	/**
	 * Writes an informational line, tagged with the command this registry belongs to.
	 */
	private info(message: string, ...other: unknown[]) {
		container.logger.info(
			`ApplicationCommandRegistry[${this.commandName}] ${message}`,
			...other,
		);
	}

	/**
	 * Writes an error line, tagged with the command this registry belongs to.
	 */
	private error(message: string, ...other: unknown[]) {
		container.logger.error(
			`ApplicationCommandRegistry[${this.commandName}] ${message}`,
			...other,
		);
	}

	/**
	 * Writes a warning line, tagged with the command this registry belongs to.
	 */
	private warn(message: string, ...other: unknown[]) {
		container.logger.warn(
			`ApplicationCommandRegistry[${this.commandName}] ${message}`,
			...other,
		);
	}

	/**
	 * Writes a debug line, tagged with the command this registry belongs to.
	 */
	private debug(message: string, ...other: unknown[]) {
		container.logger.debug(
			`ApplicationCommandRegistry[${this.commandName}] ${message}`,
			...other,
		);
	}

	/**
	 * Writes a trace line, tagged with the command this registry belongs to.
	 */
	private trace(message: string, ...other: unknown[]) {
		container.logger.trace(
			`ApplicationCommandRegistry[${this.commandName}] ${message}`,
			...other,
		);
	}
}
