import {
	ChannelType,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type AutocompleteInteraction,
	type Message,
} from "discord.js";
import type {
	ApplicationCommandRegistry,
	AutocompleteCommand,
	Awaitable,
	ChatInputCommand,
	ChatInputCommandRunContext,
	CommandJSON,
	CommandOptions,
	CommandRunInUnion,
	CommandSpecificRunIn,
	ContextMenuCommand,
	ContextMenuCommandRunContext,
	DetailedDescriptionCommand,
	MessageCommand,
	MessageCommandRunContext,
	PieceLoaderContext,
	UnorderedStrategy,
} from "@types";
import { ArgumentStream, Lexer, Parser } from "@utilities/lexure/index.ts";
import { isFunction, isNullish, isObject } from "@utilities/common/index.ts";
import { AliasPiece } from "@/loader/aliasPiece.ts";
import { RegisterBehavior } from "@/constants/enums.ts";
import { Args } from "@/parsers/args.ts";
import { FlagUnorderedStrategy } from "@/parsers/flagUnorderedStrategy.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import {
	parseConstructorPreConditionsCooldown,
	parseConstructorPreConditionsNsfw,
	parseConstructorPreConditionsRequiredClientPermissions,
	parseConstructorPreConditionsRequiredUserPermissions,
	parseConstructorPreConditionsRunIn,
} from "@/preconditions/resolvers/index.ts";
import {
	acquire,
	getDefaultBehaviorWhenNotIdentical,
	handleBulkOverwrite,
} from "@/applicationCommands/registries.ts";
import { getNeededRegistryParameters } from "@/applicationCommands/neededParameters.ts";
import { emitPerRegistryError } from "@/applicationCommands/registryErrors.ts";

/**
 * Every channel type discord.js knows about, as a numeric list.
 */
const ChannelTypes = Object.values(ChannelType).filter(
	(type) => typeof type === "number",
) as readonly ChannelType[];

/**
 * Every channel type that exists inside a guild — that is, everything except the two DM kinds.
 */
const GuildChannelTypes = ChannelTypes.filter(
	(type) => type !== ChannelType.DM && type !== ChannelType.GroupDM,
) as readonly ChannelType[];

/**
 * A command a bot exposes to its users.
 *
 * One class can serve several entry points at once: implement `messageRun` for a prefixed message
 * command, `chatInputRun` for a slash command, `contextMenuRun` for a right-click command, and
 * `autocompleteRun` to fill in suggestions. Kairo only routes to the handlers that are present.
 *
 * @since 1.0.0
 */
export class Command<
	PreParseReturn = Args,
	Options extends CommandOptions = CommandOptions,
> extends AliasPiece<Options, "commands"> {
	/**
	 * The command's name exactly as written, before it was lowercased for storage.
	 *
	 * The `name` a command is stored and looked up under is always lowercase; this keeps the original
	 * casing for anything user-facing, such as a help listing.
	 */
	public rawName: string;

	/**
	 * A one-line summary of what this command does.
	 */
	public description: string;

	/**
	 * The preconditions that must pass before this command may run.
	 */
	public preconditions: PreconditionContainerArray;

	/**
	 * A longer explanation of the command and how to use it.
	 */
	public detailedDescription: DetailedDescriptionCommand;

	/**
	 * The folders this command sits in, innermost last.
	 *
	 * Unless `fullCategory` was given explicitly, this is the command's path relative to the commands
	 * directory — a command at `commands/general/information/info.ts` gets
	 * `["general", "information"]`. Manually registered commands get `[]`.
	 */
	public readonly fullCategory: readonly string[];

	/**
	 * How the parser splits flags and options out of a message command's parameters.
	 */
	public strategy: UnorderedStrategy;

	/**
	 * Whether to show the typing indicator while this command runs.
	 *
	 * Only consulted when the client has typing enabled globally; otherwise it is ignored.
	 *
	 * @default true
	 */
	public typing: boolean;

	/**
	 * This command's application-command registry, holding the slash and context-menu commands it
	 * registers with Discord.
	 */
	public readonly applicationCommandRegistry = acquire(this.name);

	/**
	 * Splits a message command's raw parameters into tokens, honouring the configured quote pairs.
	 */
	protected lexer: Lexer;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The command's name, description, preconditions and parsing behaviour.
	 */
	public constructor(
		context: PieceLoaderContext<"commands">,
		options: Options = {} as Options,
	) {
		const name = options.name ?? context.name;
		super(context, { ...options, name: name.toLowerCase() });

		this.rawName = name;
		this.description = options.description ?? "";
		this.detailedDescription = options.detailedDescription ?? "";
		this.strategy = new FlagUnorderedStrategy(options);
		this.fullCategory = options.fullCategory ?? this.location.directories;
		this.typing = options.typing ?? true;

		this.lexer = new Lexer({
			quotes: options.quotes ?? [
				['"', '"'], // Straight double quotes.
				["“", "”"], // Curly quotes, which iOS substitutes automatically.
				["「", "」"], // Corner brackets, common in CJK input.
				["«", "»"], // Guillemets, common in French input.
			],
		});

		if (options.generateDashLessAliases) {
			const dashLess: string[] = [];
			if (this.name.includes("-")) dashLess.push(this.name.replaceAll("-", ""));
			for (const alias of this.aliases)
				if (alias.includes("-")) dashLess.push(alias.replaceAll("-", ""));

			this.aliases = [...this.aliases, ...dashLess];
		}

		if (options.generateUnderscoreLessAliases) {
			const underscoreLess: string[] = [];
			if (this.name.includes("_"))
				underscoreLess.push(this.name.replaceAll("_", ""));
			for (const alias of this.aliases)
				if (alias.includes("_")) underscoreLess.push(alias.replaceAll("_", ""));

			this.aliases = [...this.aliases, ...underscoreLess];
		}

		this.preconditions = new PreconditionContainerArray(options.preconditions);
		this.parseConstructorPreConditions(options);
	}

	/**
	 * Turns a message command's raw parameter string into whatever `messageRun` receives as its
	 * `args`. Override this to substitute your own argument parser.
	 *
	 * @param message The message that invoked the command.
	 * @param parameters Everything after the command name, unparsed.
	 * @param context The context this invocation is running under.
	 */
	public messagePreParse(
		message: Message,
		parameters: string,
		context: MessageCommandRunContext,
	): Awaitable<PreParseReturn> {
		const parser = new Parser(this.strategy);
		const stream = new ArgumentStream(parser.run(this.lexer.run(parameters)));
		return new Args(
			message,
			this as MessageCommand,
			stream,
			context,
		) as PreParseReturn;
	}

	/**
	 * The outermost folder this command sits in, or `null` if it sits at the top level.
	 */
	public get category(): string | null {
		return this.fullCategory.at(0) ?? null;
	}

	/**
	 * The second folder this command sits in, or `null` if it is not nested that deep.
	 */
	public get subCategory(): string | null {
		return this.fullCategory.at(1) ?? null;
	}

	/**
	 * The innermost folder this command sits in, or `null` if it sits at the top level.
	 */
	public get parentCategory(): string | null {
		return this.fullCategory.at(-1) ?? null;
	}

	/**
	 * Runs the command in response to a prefixed message. Implement this to support message commands.
	 *
	 * @param message The message that invoked the command.
	 * @param args Whatever {@link Command.messagePreParse} produced — an {@link Args} by default.
	 * @param context The context this invocation is running under.
	 */
	public messageRun?(
		message: Message,
		args: PreParseReturn,
		context: MessageCommandRunContext,
	): Awaitable<unknown>;

	/**
	 * Runs the command in response to a slash command. Implement this to support chat input commands.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param context The context this invocation is running under.
	 */
	public chatInputRun?(
		interaction: ChatInputCommandInteraction,
		context: ChatInputCommandRunContext,
	): Awaitable<unknown>;

	/**
	 * Runs the command in response to a context-menu entry. Implement this to support those.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param context The context this invocation is running under.
	 */
	public contextMenuRun?(
		interaction: ContextMenuCommandInteraction,
		context: ContextMenuCommandRunContext,
	): Awaitable<unknown>;

	/**
	 * Supplies autocomplete suggestions for this command's options.
	 *
	 * An {@link InteractionHandler} can do this instead; where both exist, the command wins.
	 *
	 * @param interaction The autocomplete interaction to respond to.
	 */
	public autocompleteRun?(
		interaction: AutocompleteInteraction,
	): Awaitable<unknown>;

	/**
	 * Declares the application commands this command owns. Implement this to register slash or
	 * context-menu commands with Discord.
	 *
	 * @param registry This command's registry.
	 */
	public registerApplicationCommands?(
		registry: ApplicationCommandRegistry,
	): Awaitable<void>;

	/**
	 * Defines how this command is serialised by `JSON.stringify`.
	 */
	public override toJSON(): CommandJSON {
		return {
			...super.toJSON(),
			description: this.description,
			detailedDescription: this.detailedDescription,
			category: this.category,
		};
	}

	/**
	 * Whether this command handles prefixed messages.
	 */
	public supportsMessageCommands(): this is MessageCommand {
		return isFunction(Reflect.get(this, "messageRun"));
	}

	/**
	 * Whether this command handles slash commands.
	 */
	public supportsChatInputCommands(): this is ChatInputCommand {
		return isFunction(Reflect.get(this, "chatInputRun"));
	}

	/**
	 * Whether this command handles context-menu entries.
	 */
	public supportsContextMenuCommands(): this is ContextMenuCommand {
		return isFunction(Reflect.get(this, "contextMenuRun"));
	}

	/**
	 * Whether this command supplies autocomplete suggestions.
	 */
	public supportsAutocompleteInteractions(): this is AutocompleteCommand {
		return isFunction(Reflect.get(this, "autocompleteRun"));
	}

	/**
	 * Reloads this command from disk and rebuilds its application-command registrations.
	 *
	 * The registry is torn down and rebuilt rather than reused, because a reloaded file may declare
	 * an entirely different set of application commands; leaving the old entries in place would keep
	 * stale aliases resolving to a command that no longer claims them.
	 */
	public override async reload() {
		const { store } = this;
		const registry = this.applicationCommandRegistry;

		// Drop the aliases this command claimed, but only the ones still pointing at it.
		for (const nameOrId of registry.chatInputCommands) {
			if (store.aliases.get(nameOrId) === this) store.aliases.delete(nameOrId);
		}

		for (const nameOrId of registry.contextMenuCommands) {
			if (store.aliases.get(nameOrId) === this) store.aliases.delete(nameOrId);
		}

		registry.chatInputCommands.clear();
		registry.contextMenuCommands.clear();
		registry.guildIdsToFetch.clear();
		registry.clearApiCalls();

		await super.reload();

		// The reload replaced this instance, so work with whatever the store holds now.
		const reloaded = store.get(this.name);
		if (!reloaded) return;

		const reloadedRegistry = reloaded.applicationCommandRegistry;

		if (reloaded.registerApplicationCommands) {
			try {
				await reloaded.registerApplicationCommands(reloadedRegistry);
			} catch (error) {
				emitPerRegistryError(error, reloaded);
				return;
			}
		}

		if (!reloadedRegistry.hasApiCalls()) return;

		if (
			getDefaultBehaviorWhenNotIdentical() === RegisterBehavior.BulkOverwrite
		) {
			await handleBulkOverwrite(
				store,
				this.container.client.application!.commands,
			);
			return;
		}

		const { applicationCommands, globalCommands, guildCommands } =
			await getNeededRegistryParameters(reloadedRegistry.guildIdsToFetch);
		await reloadedRegistry.runApiCalls(
			applicationCommands,
			globalCommands,
			guildCommands,
		);

		for (const nameOrId of reloadedRegistry.chatInputCommands) {
			store.aliases.set(nameOrId, reloaded);
		}

		for (const nameOrId of reloadedRegistry.contextMenuCommands) {
			store.aliases.set(nameOrId, reloaded);
		}
	}

	/**
	 * Turns the command's own options into preconditions, so `nsfw: true` or `cooldownDelay` need no
	 * separate precondition to be listed by hand.
	 *
	 * @param options The options this command was constructed with.
	 */
	protected parseConstructorPreConditions(options: CommandOptions): void {
		this.parseConstructorPreConditionsRunIn(options);
		this.parseConstructorPreConditionsNsfw(options);
		this.parseConstructorPreConditionsRequiredClientPermissions(options);
		this.parseConstructorPreConditionsRequiredUserPermissions(options);
		this.parseConstructorPreConditionsCooldown(options);
	}

	/**
	 * Adds the `NSFW` precondition when the command declares itself NSFW.
	 */
	protected parseConstructorPreConditionsNsfw(options: CommandOptions) {
		parseConstructorPreConditionsNsfw(options.nsfw, this.preconditions);
	}

	/**
	 * Adds the `RunIn` precondition for the channel types the command declared, if any.
	 */
	protected parseConstructorPreConditionsRunIn(options: CommandOptions) {
		parseConstructorPreConditionsRunIn(
			options.runIn,
			this.resolveConstructorPreConditionsRunType.bind(this),
			this.preconditions,
		);
	}

	/**
	 * Adds the `ClientPermissions` precondition when the command needs permissions the bot must hold.
	 */
	protected parseConstructorPreConditionsRequiredClientPermissions(
		options: CommandOptions,
	) {
		parseConstructorPreConditionsRequiredClientPermissions(
			options.requiredClientPermissions,
			this.preconditions,
		);
	}

	/**
	 * Adds the `UserPermissions` precondition when the command needs permissions the caller must hold.
	 */
	protected parseConstructorPreConditionsRequiredUserPermissions(
		options: CommandOptions,
	) {
		parseConstructorPreConditionsRequiredUserPermissions(
			options.requiredUserPermissions,
			this.preconditions,
		);
	}

	/**
	 * Adds the `Cooldown` precondition when both a limit and a delay were given.
	 */
	protected parseConstructorPreConditionsCooldown(options: CommandOptions) {
		parseConstructorPreConditionsCooldown(
			this,
			options.cooldownLimit,
			options.cooldownDelay,
			options.cooldownScope,
			options.cooldownFilteredUsers,
			this.preconditions,
		);
	}

	/**
	 * Expands whatever `runIn` was given — a single value, a friendly string, or a nested array — into
	 * the concrete discord.js channel types it stands for.
	 *
	 * Returning `null` means "no restriction", which is also what a set covering every channel type
	 * collapses to: checking a precondition that can never fail is wasted work.
	 *
	 * @param types The value given for `runIn`.
	 * @returns The channel types the command may run in, or `null` for no restriction.
	 * @throws {Error} If an empty array was given, which would forbid the command everywhere.
	 */
	protected resolveConstructorPreConditionsRunType(
		types: CommandRunInUnion,
	): readonly ChannelType[] | null {
		if (isNullish(types)) return null;
		if (typeof types === "number") return [types];

		if (typeof types === "string") {
			switch (types) {
				case "DM":
					return [ChannelType.DM];
				case "GUILD_TEXT":
					return [ChannelType.GuildText];
				case "GUILD_VOICE":
					return [ChannelType.GuildVoice];
				case "GUILD_NEWS":
					return [ChannelType.GuildAnnouncement];
				case "GUILD_NEWS_THREAD":
					return [ChannelType.AnnouncementThread];
				case "GUILD_PUBLIC_THREAD":
					return [ChannelType.PublicThread];
				case "GUILD_PRIVATE_THREAD":
					return [ChannelType.PrivateThread];
				case "GUILD_ANY":
					return GuildChannelTypes;
				default:
					return null;
			}
		}

		if (types.length === 0) {
			throw new Error(
				`${this.constructor.name}[${this.name}]: "runIn" was specified as an empty array.`,
			);
		}

		if (types.length === 1) {
			return this.resolveConstructorPreConditionsRunType(types[0]);
		}

		const resolved = new Set<ChannelType>();
		for (const entry of types) {
			for (const type of this.resolveConstructorPreConditionsRunType(entry) ??
				[])
				resolved.add(type);
		}

		// Covering every channel type is the same as no restriction at all.
		if (resolved.size === ChannelTypes.length) return null;

		return [...resolved].sort((a, b) => a - b);
	}

	/**
	 * Whether a `runIn` value names each entry point separately rather than applying to all of them.
	 *
	 * @param types The value given for `runIn`.
	 */
	public static runInTypeIsSpecificsObject(
		types: CommandOptions["runIn"],
	): types is CommandSpecificRunIn {
		if (!isObject(types)) return false;

		const specific = types as CommandSpecificRunIn;
		return Boolean(
			specific.chatInputRun || specific.messageRun || specific.contextMenuRun,
		);
	}
}
