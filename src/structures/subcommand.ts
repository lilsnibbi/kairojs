import type { ChatInputCommandInteraction, Message } from "discord.js";
import type {
	ChatInputCommand,
	ChatInputCommandRunContext,
	ChatInputCommandSubcommandMappingMethod,
	ChatInputSubcommandAcceptedPayload,
	MessageCommand,
	MessageCommandRunContext,
	MessageSubcommandAcceptedPayload,
	MessageSubcommandMappingMethod,
	PieceLoaderContext,
	PreconditionContext,
	SubcommandMappingArray,
	SubcommandMappingMethod,
	SubcommandOptions,
} from "@types";
import type { Args } from "@/parsers/args.ts";
import { Result } from "@utilities/result/index.ts";
import { cast, deepClone } from "@utilities/common/index.ts";
import {
	SubcommandPluginEvents,
	SubcommandPluginIdentifiers,
} from "@/constants/subcommands.ts";
import { UserError } from "@/errors/userError.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import {
	parseConstructorPreConditionsNsfw,
	parseConstructorPreConditionsRequiredClientPermissions,
	parseConstructorPreConditionsRequiredUserPermissions,
	parseConstructorPreConditionsRunIn,
	parseSubcommandConstructorPreConditionsCooldown,
} from "@/preconditions/resolvers/index.ts";
import { Command } from "./command.ts";

/**
 * A command that routes to one of several handlers depending on what the caller asked for.
 *
 * The mappings given through `subcommands` are the whole configuration: each names a subcommand and
 * says what to run for it, either as a method name on the class or as an inline implementation. A
 * mapping may instead be a group, nesting another level of subcommands beneath it. `messageRun` and
 * `chatInputRun` are implemented here to perform that routing, which is why only commands that
 * actually have subcommands should extend this — everything else pays for machinery it never uses.
 *
 * @example
 * ```typescript
 * import { Subcommand } from "kairojs";
 *
 * export class ConfigCommand extends Subcommand {
 *   public constructor(context: PieceLoaderContext<"commands">) {
 *     super(context, {
 *       name: "config",
 *       subcommands: [
 *         { name: "show", messageRun: "showConfig", default: true },
 *         {
 *           name: "set",
 *           type: "group",
 *           entries: [{ name: "prefix", messageRun: "setPrefix", requiredUserPermissions: ["ManageGuild"] }]
 *         }
 *       ]
 *     });
 *   }
 *
 *   public showConfig(message: Message) {
 *     return message.reply("Here is your configuration.");
 *   }
 *
 *   public setPrefix(message: Message, args: Args) {
 *     return message.reply(`Prefix set to ${await args.pick("string")}.`);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class Subcommand<
	PreParseReturn extends Args = Args,
	Options extends SubcommandOptions = SubcommandOptions,
> extends Command<PreParseReturn, Options> {
	/**
	 * The preconditions each subcommand must pass, keyed by the subcommand's name — or by
	 * `groupName.subcommandName` for one inside a group.
	 */
	public readonly subcommandPreconditions = new Map<
		string,
		PreconditionContainerArray
	>();

	/**
	 * The mappings this command routes with, built from the `subcommands` option at construction.
	 */
	public parsedSubcommandMappings: SubcommandMappingArray;

	/**
	 * Whether a subcommand's name may be typed in any casing.
	 *
	 * This only ever affects message commands, since Discord already lowercases chat input command
	 * names. It follows the client's own `caseInsensitiveCommands` setting.
	 */
	public caseInsensitiveSubcommands = false;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options The command's own options, plus the subcommand mappings to route with.
	 */
	public constructor(
		context: PieceLoaderContext<"commands">,
		options: Options,
	) {
		super(context, options);
		this.parsedSubcommandMappings = options.subcommands ?? [];

		const clientOptions = this.container.client.options;

		if (clientOptions.caseInsensitiveCommands) {
			this.caseInsensitiveSubcommands = true;

			// Chat input names are lowercase already, so lowercasing everything is safe and means the
			// comparisons below never have to branch on which entry point they are serving.
			for (const mapping of this.parsedSubcommandMappings) {
				mapping.name = mapping.name.toLowerCase();

				if (mapping.type === "group") {
					for (const groupedSubcommand of mapping.entries) {
						groupedSubcommand.name = groupedSubcommand.name.toLowerCase();
					}
				}
			}
		}

		if (options.generateDashLessAliases)
			this.generateDashLessSubcommandAliases();

		for (const subcommand of this.parsedSubcommandMappings) {
			subcommand.type ??= "method";

			if (subcommand.type === "method") {
				this.subcommandPreconditions.set(
					subcommand.name,
					this.buildSubcommandPreconditions(subcommand),
				);
			}

			if (subcommand.type === "group") {
				for (const groupedSubcommand of subcommand.entries) {
					this.subcommandPreconditions.set(
						`${subcommand.name}.${groupedSubcommand.name}`,
						this.buildSubcommandPreconditions(
							groupedSubcommand,
							subcommand.name,
						),
					);
				}
			}
		}
	}

	/**
	 * Picks up mappings declared on the class itself through a `subcommandMappings` property, which
	 * is how a decorator supplies them: the decorator runs after the constructor has already read
	 * `options.subcommands`, so the mappings have to be collected again once the piece is loaded.
	 */
	public override onLoad() {
		super.onLoad();

		const externalMapping = Reflect.get(this, "subcommandMappings");
		if (externalMapping) {
			const subcommands = Array.isArray(externalMapping)
				? (externalMapping as SubcommandMappingArray)
				: [];
			this.parsedSubcommandMappings = subcommands;
			this.options.subcommands = subcommands;
		}
	}

	/**
	 * Whether any mapping routes to a message handler.
	 */
	public override supportsMessageCommands(): this is MessageCommand {
		return this.supportsCommandType("messageRun");
	}

	/**
	 * Whether any mapping routes to a chat input handler.
	 */
	public override supportsChatInputCommands(): this is ChatInputCommand {
		return this.supportsCommandType("chatInputRun");
	}

	/**
	 * Routes a prefixed message to the subcommand it named.
	 *
	 * The first two words are read speculatively and the argument stream is then restored, so a
	 * handler always receives the arguments it expects regardless of how deep the match went. Only
	 * once a mapping is settled on are those words consumed for real.
	 *
	 * **Do not override this** — it is the routing itself.
	 *
	 * @param message The message that invoked the command.
	 * @param args The parsed arguments, positioned at the subcommand name.
	 * @param context The context this invocation is running under.
	 */
	public override async messageRun(
		message: Message,
		args: PreParseReturn,
		context: MessageCommandRunContext,
	) {
		args.save();
		const subcommandOrGroup = args.nextMaybe();
		const subcommandName = args.nextMaybe();

		let defaultCommand: SubcommandMappingMethod | null = null;
		let actualSubcommandToRun: SubcommandMappingMethod | null = null;
		let matchedWithGroupedSubcommand = false;

		for (const mapping of this.parsedSubcommandMappings) {
			mapping.type ??= "method";

			if (mapping.type === "method") {
				if (mapping.default && !defaultCommand) {
					matchedWithGroupedSubcommand = false;
					defaultCommand = mapping;
				}

				if (
					subcommandOrGroup.isSomeAnd(
						(value) =>
							mapping.name ===
							(this.caseInsensitiveSubcommands ? value.toLowerCase() : value),
					)
				) {
					actualSubcommandToRun = mapping;
					matchedWithGroupedSubcommand = false;
					break;
				}
			}

			// A group can only match when both words are present: one names the group, one the
			// subcommand inside it.
			if (
				mapping.type === "group" &&
				subcommandOrGroup.isSome() &&
				subcommandName.isSome()
			) {
				const groupName = subcommandOrGroup.unwrap();
				const nameInGroup = subcommandName.unwrap();

				if (mapping.name === groupName) {
					const findResult = this.findSubcommand(
						mapping.entries,
						this.caseInsensitiveSubcommands
							? nameInGroup.toLowerCase()
							: nameInGroup,
					);

					if (findResult.defaultMatch) {
						defaultCommand = findResult.mapping;
						matchedWithGroupedSubcommand = true;
					} else {
						actualSubcommandToRun = findResult.mapping;
						matchedWithGroupedSubcommand = true;
						break;
					}
				}
			}
		}

		// Restore before consuming anything, so what follows starts from a known position.
		args.restore();

		if (actualSubcommandToRun) {
			// Drop the word naming the subcommand or the group.
			args.next();

			let subcommandGroupName: string | undefined;
			if (matchedWithGroupedSubcommand) {
				subcommandGroupName = subcommandOrGroup.unwrap();

				// Inside a group there is a second word to drop: the subcommand's own name.
				args.next();
			}

			return this.handleMessageRun(
				message,
				args,
				context,
				actualSubcommandToRun,
				subcommandGroupName,
			);
		}

		if (defaultCommand) {
			let subcommandGroupName: string | undefined;
			if (matchedWithGroupedSubcommand) {
				subcommandGroupName = subcommandOrGroup.unwrap();
				args.next();
			}

			return this.handleMessageRun(
				message,
				args,
				context,
				defaultCommand,
				subcommandGroupName,
			);
		}

		const commandPrefix = this.resolveCommandPrefix(
			message.content,
			args.commandContext.prefix,
		);
		const prefixLessContent = message.content
			.slice(commandPrefix.length)
			.trim();

		this.container.client.emit(
			SubcommandPluginEvents.MessageSubcommandNoMatch,
			message,
			args,
			{
				...context,
				command: cast<Subcommand>(this),
				identifier: SubcommandPluginIdentifiers.MessageSubcommandNoMatch,
				message: `Unable to match a subcommand on message command "${this.name}" at path "${this.location.full}" with content ${prefixLessContent}`,
				possibleSubcommandName: subcommandName.unwrapOr(null),
				possibleSubcommandGroupOrName: subcommandOrGroup.unwrapOr(null),
			},
		);
	}

	/**
	 * Routes a slash command to the subcommand Discord named.
	 *
	 * There is no speculation to do here: the interaction states its subcommand and group outright,
	 * which is also why a group's `default` entry is never reached from this path.
	 *
	 * **Do not override this** — it is the routing itself.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param context The context this invocation is running under.
	 */
	public override async chatInputRun(
		interaction: ChatInputCommandInteraction,
		context: ChatInputCommandRunContext,
	) {
		const subcommandName = interaction.options.getSubcommand(false);
		const subcommandGroupName = interaction.options.getSubcommandGroup(false);

		for (const mapping of this.parsedSubcommandMappings) {
			mapping.type ??= "method";

			// A named group means the subcommand lives inside it; nothing at the top level can match.
			if (subcommandGroupName && subcommandName) {
				if (mapping.type !== "group") continue;
				if (mapping.name !== subcommandGroupName) continue;

				const foundSubcommand = this.findSubcommand(
					mapping.entries,
					subcommandName,
				);

				// An interaction always names its subcommand, so falling back to the group's default
				// would run something the caller never asked for.
				if (!foundSubcommand.defaultMatch) {
					return this.handleChatInputInteractionRun(
						interaction,
						context,
						foundSubcommand.mapping,
						subcommandGroupName,
					);
				}

				continue;
			}

			if (mapping.type === "method" && mapping.name === subcommandName) {
				return this.handleChatInputInteractionRun(
					interaction,
					context,
					mapping,
					undefined,
				);
			}
		}

		this.container.client.emit(
			SubcommandPluginEvents.ChatInputSubcommandNoMatch,
			interaction,
			{
				...context,
				command: cast<Subcommand>(this),
				identifier: SubcommandPluginIdentifiers.ChatInputSubcommandNoMatch,
				message: `Unable to match a subcommand on chat input command "${this.name}" at path "${this.location.full}"`,
			},
		);
	}

	/**
	 * Adds hyphen-free copies of every message subcommand whose name contains a hyphen.
	 *
	 * A group is handled on both levels at once: the entries inside it gain hyphen-free copies, and
	 * the group itself gains a hyphen-free name carrying all of them.
	 */
	private generateDashLessSubcommandAliases() {
		for (const mapping of this.parsedSubcommandMappings) {
			// Chat input subcommand names are fixed by what was registered with Discord, so only
			// mappings reachable from a message are worth aliasing.
			if (!Reflect.has(mapping, "messageRun")) continue;

			const dashLessMappings: SubcommandMappingArray = [];

			if (mapping.type === "group") {
				// Cloned so the aliases can be collected without mutating the original mapping.
				const clonedMapping = deepClone(mapping);
				let hasChangedEntries = false;

				for (const groupedSubcommand of mapping.entries) {
					if (groupedSubcommand.name.includes("-")) {
						hasChangedEntries = true;

						clonedMapping.entries.push({
							...groupedSubcommand,
							name: groupedSubcommand.name.replaceAll("-", ""),
						});
					}
				}

				// The group keeps its own name but gains the hyphen-free entries.
				if (hasChangedEntries) {
					dashLessMappings.push({ ...mapping, entries: clonedMapping.entries });
				}

				// A hyphenated group name gets a copy of its own, carrying whichever entries the
				// clone ended up with — the originals when nothing changed, both spellings otherwise.
				if (clonedMapping.name.includes("-")) {
					clonedMapping.name = clonedMapping.name.replaceAll("-", "");
					dashLessMappings.push(clonedMapping);
				}
			} else if (mapping.name.includes("-")) {
				dashLessMappings.push({
					...mapping,
					name: mapping.name.replaceAll("-", ""),
				});
			}

			for (const dashLessMapping of dashLessMappings)
				this.parsedSubcommandMappings.push(dashLessMapping);
		}
	}

	/**
	 * Turns one mapping's own options into the precondition list that mapping is gated by.
	 *
	 * @param subcommand The mapping to read the shortcuts off.
	 * @param subcommandGroupName The group the mapping sits in, if any.
	 */
	private buildSubcommandPreconditions(
		subcommand: SubcommandMappingMethod,
		subcommandGroupName?: string,
	) {
		const preconditionContainerArray = new PreconditionContainerArray(
			subcommand.preconditions,
		);

		parseConstructorPreConditionsRunIn(
			subcommand.runIn,
			this.resolveConstructorPreConditionsRunType.bind(this),
			preconditionContainerArray,
		);
		parseConstructorPreConditionsNsfw(
			subcommand.nsfw,
			preconditionContainerArray,
		);
		parseConstructorPreConditionsRequiredClientPermissions(
			subcommand.requiredClientPermissions,
			preconditionContainerArray,
		);
		parseConstructorPreConditionsRequiredUserPermissions(
			subcommand.requiredUserPermissions,
			preconditionContainerArray,
		);
		parseSubcommandConstructorPreConditionsCooldown({
			subcommand: cast<Subcommand>(this),
			cooldownDelay: subcommand.cooldownDelay,
			cooldownFilteredUsers: subcommand.cooldownFilteredUsers,
			cooldownLimit: subcommand.cooldownLimit,
			cooldownScope: subcommand.cooldownScope,
			subcommandGroupName,
			subcommandMethodName: subcommand.name,
			preconditionContainerArray,
		});

		return preconditionContainerArray;
	}

	/**
	 * Recovers the literal prefix text from a message, which for a regular expression prefix is
	 * whatever it matched rather than the pattern itself.
	 *
	 * @param content The message's content.
	 * @param prefix The prefix that matched.
	 */
	private resolveCommandPrefix(
		content: string,
		prefix: string | RegExp,
	): string {
		return typeof prefix === "string" ? prefix : prefix.exec(content)![0];
	}

	/**
	 * Reads whatever is left of the argument stream as a string, without consuming it.
	 *
	 * The result is best-effort and stays absent when there is nothing left, which is why the
	 * denial payload declares those parameters optional.
	 *
	 * @param args The argument stream to peek at.
	 */
	private async readRemainingParameters(args: Args) {
		args.save();
		const parameters = await args.restResult("string");
		args.restore();

		return parameters.isOk() ? { parameters: parameters.unwrap() } : {};
	}

	/**
	 * Runs a matched mapping's message handler, gated by that mapping's own preconditions.
	 *
	 * @param message The message that invoked the command.
	 * @param args The argument stream, positioned past the subcommand name.
	 * @param context The context this invocation is running under.
	 * @param subcommand The mapping that matched.
	 * @param subcommandGroupName The group the mapping sits in, if any.
	 */
	private async handleMessageRun(
		message: Message,
		args: Args,
		context: MessageCommandRunContext,
		subcommand: SubcommandMappingMethod,
		subcommandGroupName: string | undefined,
	) {
		const payload: MessageSubcommandAcceptedPayload = {
			message,
			command: cast<Subcommand>(this),
			context,
			matchedSubcommandMapping: subcommand,
		};

		const preconditionsForSubcommand = this.subcommandPreconditions.get(
			subcommandGroupName
				? `${subcommandGroupName}.${subcommand.name}`
				: subcommand.name,
		);

		if (preconditionsForSubcommand) {
			const remainingParameters = await this.readRemainingParameters(args);
			const preconditionPayload = { ...remainingParameters, ...payload };

			const localSubcommandResult = await preconditionsForSubcommand.messageRun(
				message,
				cast<MessageCommand>(this),
				cast<PreconditionContext>(preconditionPayload),
			);

			if (localSubcommandResult.isErr()) {
				this.container.client.emit(
					SubcommandPluginEvents.MessageSubcommandDenied,
					localSubcommandResult.unwrapErr(),
					preconditionPayload,
				);
				return;
			}
		}

		const outcome = await Result.fromAsync(async () => {
			if (!subcommand.messageRun) {
				this.container.client.emit(
					SubcommandPluginEvents.SubcommandMappingIsMissingMessageCommandHandler,
					message,
					subcommand,
					payload,
				);
				return;
			}

			const matched = subcommand as MessageSubcommandMappingMethod;
			this.container.client.emit(
				SubcommandPluginEvents.MessageSubcommandRun,
				message,
				matched,
				payload,
			);

			let result: unknown;

			if (typeof subcommand.messageRun === "string") {
				const method = Reflect.get(this, subcommand.messageRun);
				if (!method) {
					throw new UserError({
						identifier: SubcommandPluginIdentifiers.SubcommandNotFound,
						message: `The method configured at "messageRun" for the subcommand ${subcommand.name} was not implemented in the class.`,
						context: { ...payload },
					});
				}

				result = await Reflect.apply(cast<this["messageRun"]>(method), this, [
					message,
					args,
					context,
				]);
			} else {
				result = await subcommand.messageRun(message, args, context);
			}

			this.container.client.emit(
				SubcommandPluginEvents.MessageSubcommandSuccess,
				message,
				matched,
				{ ...payload, result },
			);
		});

		outcome.inspectErr((error) =>
			this.container.client.emit(
				SubcommandPluginEvents.MessageSubcommandError,
				error,
				payload,
			),
		);
	}

	/**
	 * Runs a matched mapping's chat input handler, gated by that mapping's own preconditions.
	 *
	 * @param interaction The interaction that invoked the command.
	 * @param context The context this invocation is running under.
	 * @param subcommand The mapping that matched.
	 * @param subcommandGroupName The group the mapping sits in, if any.
	 */
	private async handleChatInputInteractionRun(
		interaction: ChatInputCommandInteraction,
		context: ChatInputCommandRunContext,
		subcommand: SubcommandMappingMethod,
		subcommandGroupName: string | undefined,
	) {
		const payload: ChatInputSubcommandAcceptedPayload = {
			command: cast<Subcommand>(this),
			context,
			interaction,
			matchedSubcommandMapping: subcommand,
		};

		const preconditionsForSubcommand = this.subcommandPreconditions.get(
			subcommandGroupName
				? `${subcommandGroupName}.${subcommand.name}`
				: subcommand.name,
		);

		if (preconditionsForSubcommand) {
			const localSubcommandResult =
				await preconditionsForSubcommand.chatInputRun(
					interaction,
					cast<ChatInputCommand>(this),
					cast<PreconditionContext>(payload),
				);

			if (localSubcommandResult.isErr()) {
				this.container.client.emit(
					SubcommandPluginEvents.ChatInputSubcommandDenied,
					localSubcommandResult.unwrapErr(),
					payload,
				);
				return;
			}
		}

		const outcome = await Result.fromAsync(async () => {
			if (!subcommand.chatInputRun) {
				this.container.client.emit(
					SubcommandPluginEvents.SubcommandMappingIsMissingChatInputCommandHandler,
					interaction,
					subcommand,
					payload,
				);
				return;
			}

			const matched = subcommand as ChatInputCommandSubcommandMappingMethod;
			this.container.client.emit(
				SubcommandPluginEvents.ChatInputSubcommandRun,
				interaction,
				matched,
				payload,
			);

			let result: unknown;

			if (typeof subcommand.chatInputRun === "string") {
				const method = Reflect.get(this, subcommand.chatInputRun);
				if (!method) {
					throw new UserError({
						identifier: SubcommandPluginIdentifiers.SubcommandNotFound,
						message: `The method configured at "chatInputRun" for the subcommand ${subcommand.name} was not implemented in the class.`,
						context: { ...payload },
					});
				}

				result = await Reflect.apply(cast<this["chatInputRun"]>(method), this, [
					interaction,
					context,
				]);
			} else {
				result = await subcommand.chatInputRun(interaction, context);
			}

			this.container.client.emit(
				SubcommandPluginEvents.ChatInputSubcommandSuccess,
				interaction,
				matched,
				{ ...payload, result },
			);
		});

		outcome.inspectErr((error) =>
			this.container.client.emit(
				SubcommandPluginEvents.ChatInputSubcommandError,
				error,
				payload,
			),
		);
	}

	/**
	 * Looks a subcommand up inside a group, falling back to whichever entry declared itself the
	 * default.
	 *
	 * @param mappings The group's entries.
	 * @param expectedName The subcommand name to look for.
	 * @returns The mapping found and whether it was reached by name or by falling back.
	 */
	private findSubcommand(
		mappings: SubcommandMappingMethod[],
		expectedName: string,
	) {
		let foundDefault: SubcommandMappingMethod | null = null;

		for (const mapping of mappings) {
			mapping.type ??= "method";

			if (mapping.default) foundDefault = mapping;
			if (mapping.name === expectedName)
				return { mapping, defaultMatch: false } as const;
		}

		return { mapping: foundDefault, defaultMatch: true } as const;
	}

	/**
	 * Whether any mapping — at the top level or inside a group — declares the given handler.
	 *
	 * @param commandType The handler to look for.
	 */
	private supportsCommandType(
		commandType: "messageRun" | "chatInputRun",
	): boolean {
		return this.parsedSubcommandMappings.some((mapping) => {
			if (mapping.type === "group")
				return mapping.entries.some((groupedSubcommand) =>
					Reflect.has(groupedSubcommand, commandType),
				);
			return Reflect.has(mapping, commandType);
		});
	}
}
