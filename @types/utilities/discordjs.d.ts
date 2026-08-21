import type {
	APIActionRowComponent,
	APIComponentInMessageActionRow,
	APIEmbed,
	APIMessage,
	ActionRowComponentOptions,
	ActionRowData,
	ApplicationEmoji,
	AutocompleteInteraction,
	BaseMessageOptions,
	ButtonInteraction,
	CategoryChannel,
	Channel,
	ChannelSelectMenuComponentData,
	ChatInputCommandInteraction,
	CollectedInteraction,
	CommandInteraction,
	DMChannel,
	DirectoryChannel,
	EmbedBuilder,
	EmojiIdentifierResolvable,
	EmojiResolvable,
	Guild,
	GuildChannel,
	GuildEmoji,
	Interaction,
	InteractionButtonComponentData,
	InteractionCollector,
	InteractionReplyOptions,
	InteractionUpdateOptions,
	JSONEncodable,
	LinkButtonComponentData,
	MentionableSelectMenuComponentData,
	Message,
	MessageActionRowComponentBuilder,
	MessageComponentInteraction,
	MessageContextMenuCommandInteraction,
	MessageCreateOptions,
	MessageEditOptions,
	MessageReaction,
	MessageReplyOptions,
	ModalSubmitInteraction,
	NewsChannel,
	PartialDMChannel,
	PartialTextBasedChannelFields,
	ReactionEmoji,
	RoleSelectMenuComponentData,
	SelectMenuComponentOptionData,
	StageChannel,
	StringSelectMenuComponentData,
	StringSelectMenuInteraction,
	TextChannel,
	ThreadChannel,
	User,
	UserContextMenuCommandInteraction,
	UserSelectMenuComponentData,
	VoiceChannel,
	WebhookMessageEditOptions,
} from "discord.js";
import type { MessagePrompterBaseStrategy } from "@utilities/discordjs/lib/messagePrompter/strategies/messagePrompterBaseStrategy.ts";
import type { MessagePrompterConfirmStrategy } from "@utilities/discordjs/lib/messagePrompter/strategies/messagePrompterConfirmStrategy.ts";
import type { MessagePrompterMessageStrategy } from "@utilities/discordjs/lib/messagePrompter/strategies/messagePrompterMessageStrategy.ts";
import type { MessagePrompterNumberStrategy } from "@utilities/discordjs/lib/messagePrompter/strategies/messagePrompterNumberStrategy.ts";
import type { MessagePrompterReactionStrategy } from "@utilities/discordjs/lib/messagePrompter/strategies/messagePrompterReactionStrategy.ts";
import type { PaginatedMessage } from "@utilities/discordjs/lib/paginatedMessages/paginatedMessage.ts";
import type { ArgumentTypes, Awaitable, Ctor } from "./utilities.d.ts";

// #region Channel and interaction unions

/**
 * Every channel class discord.js can hand you, collapsed into a single union. Useful as the input
 * type of a helper that must accept "whatever channel this is" before narrowing it down.
 *
 * @since 1.0.0
 */
export type ChannelTypes =
	| CategoryChannel
	| DMChannel
	| DirectoryChannel
	| PartialDMChannel
	| NewsChannel
	| StageChannel
	| TextChannel
	| ThreadChannel
	| VoiceChannel
	| GuildChannel
	| Channel;

/**
 * Every channel a {@link Message} can originate from, taken straight from discord.js so it stays in
 * step with the library rather than drifting from it.
 *
 * @since 1.0.0
 */
export type TextBasedChannelTypes = Message["channel"];

/**
 * The two channel kinds users can actually connect to with a voice client.
 *
 * @since 1.0.0
 */
export type VoiceBasedChannelTypes = VoiceChannel | StageChannel;

/**
 * Guild channels excluding threads — that is, channels that live directly under a guild rather than
 * under another channel.
 *
 * @since 1.0.0
 */
export type NonThreadGuildBasedChannelTypes = Extract<
	ChannelTypes,
	GuildChannel
>;

/**
 * Guild channels including threads.
 *
 * @since 1.0.0
 */
export type GuildBasedChannelTypes =
	| NonThreadGuildBasedChannelTypes
	| ThreadChannel;

/**
 * Guild channels a message can be sent in, excluding threads.
 *
 * @since 1.0.0
 */
export type NonThreadGuildTextBasedChannelTypes = Extract<
	TextBasedChannelTypes,
	GuildChannel
>;

/**
 * Guild channels a message can be sent in, including threads.
 *
 * @since 1.0.0
 */
export type GuildTextBasedChannelTypes =
	| NonThreadGuildTextBasedChannelTypes
	| ThreadChannel;

/**
 * Every `type` discriminant a channel can carry, plus the sentinel `'UNKNOWN'` for channels the
 * library could not classify.
 *
 * @since 1.0.0
 */
export type ChannelTypeString = ChannelTypes["type"] | "UNKNOWN";

/**
 * The three command-style interactions — slash commands and both context menu variants — as a
 * union rather than as the `CommandInteraction` base class.
 *
 * @since 1.0.0
 */
export type ChatInputOrContextMenuCommandInteraction =
	| ChatInputCommandInteraction
	| UserContextMenuCommandInteraction
	| MessageContextMenuCommandInteraction;

/**
 * Every interaction that arrives without a modal being submitted: the command interactions plus
 * autocomplete, string select menus and buttons.
 *
 * @since 1.0.0
 */
export type NonModalInteraction =
	| ChatInputOrContextMenuCommandInteraction
	| AutocompleteInteraction
	| StringSelectMenuInteraction
	| ButtonInteraction;

/**
 * Any interaction at all, modal submissions included.
 *
 * @since 1.0.0
 */
export type AnyInteraction = Interaction;

/**
 * Any interaction a user can actively be replied to through. Autocomplete is excluded because it
 * only accepts a list of suggestions, never a message.
 *
 * @since 1.0.0
 */
export type AnyInteractableInteraction = Exclude<
	AnyInteraction,
	AutocompleteInteraction
>;

// #endregion

// #region MessageBuilder

/**
 * A single entry of the `files` array a message may be created with.
 *
 * @since 1.0.0
 */
export type MessageBuilderFileResolvable = NonNullable<
	MessageCreateOptions["files"]
>[number];

/**
 * The plain-object form accepted by the {@link MessageBuilder} constructor and by its static
 * defaults.
 *
 * @since 1.0.0
 */
export type MessageBuilderResolvable = Omit<
	MessageCreateOptions,
	"embed" | "disableMentions" | "reply"
> & {
	embeds?: MessageCreateOptions["embeds"];
	components?: MessageCreateOptions["components"];
};

// #endregion

// #region MessagePrompter

/**
 * Everything a prompt is able to send, borrowed from discord.js' own `send` signature so the two
 * can never disagree.
 *
 * @since 1.0.0
 */
export type MessagePrompterMessage = ArgumentTypes<
	PartialTextBasedChannelFields["send"]
>[0];

/**
 * The channels a prompt can run in. Voice-based channels and categories are excluded because a
 * prompt needs somewhere to post its message and collect a response.
 *
 * @since 1.0.0
 */
export type MessagePrompterChannelTypes = Exclude<
	ChannelTypes,
	VoiceBasedChannelTypes | CategoryChannel
>;

/**
 * The data every strategy reports back when it is configured to return explicitly rather than
 * returning only the answer.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterExplicitReturnBase {
	/**
	 * The emoji the user reacted with, when the strategy collected a reaction.
	 */
	emoji?: GuildEmoji | ReactionEmoji | ApplicationEmoji;

	/**
	 * The entry of the strategy's own reaction list that matched what the user picked.
	 */
	reaction?: string | EmojiIdentifierResolvable;

	/**
	 * The strategy instance that produced this result.
	 */
	strategy: MessagePrompterBaseStrategy;

	/**
	 * The message that was actually posted (or edited) to show the prompt.
	 */
	appliedMessage: Message;

	/**
	 * The content the prompt was configured with.
	 */
	message: MessagePrompterMessage;
}

/**
 * The explicit result of a yes/no prompt.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterExplicitConfirmReturn
	extends IMessagePrompterExplicitReturnBase {
	/**
	 * Whether the user picked the confirm emoji.
	 */
	confirmed: boolean;
}

/**
 * The explicit result of a numeric prompt.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterExplicitNumberReturn
	extends IMessagePrompterExplicitReturnBase {
	/**
	 * The number the chosen emoji stands for.
	 */
	number: number;
}

/**
 * The explicit result of a prompt that waited for a message rather than a reaction.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterExplicitMessageReturn
	extends IMessagePrompterExplicitReturnBase {
	/**
	 * The message the user sent in reply.
	 */
	response?: Message;
}

/**
 * The options every prompt strategy understands.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterStrategyOptions {
	/**
	 * How long, in milliseconds, the collector waits before giving up.
	 */
	timeout?: number;

	/**
	 * Whether `run` should resolve with the full result object instead of just the answer.
	 */
	explicitReturn?: boolean;

	/**
	 * An existing message to edit into the prompt instead of sending a fresh one.
	 */
	editMessage?: Message;
}

/**
 * The options of a yes/no prompt.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterConfirmStrategyOptions
	extends IMessagePrompterStrategyOptions {
	/**
	 * The emoji that stands for "yes".
	 */
	confirmEmoji?: string | EmojiIdentifierResolvable;

	/**
	 * The emoji that stands for "no".
	 */
	cancelEmoji?: string | EmojiIdentifierResolvable;
}

/**
 * The options of a numeric prompt.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterNumberStrategyOptions
	extends IMessagePrompterStrategyOptions {
	/**
	 * The lowest number offered, inclusive. Cannot be below `0`.
	 */
	start?: number;

	/**
	 * The highest number offered, inclusive. Cannot be above `10`.
	 */
	end?: number;

	/**
	 * The emoji used for each number, in ascending order.
	 */
	numberEmojis?: string[] | EmojiIdentifierResolvable[];
}

/**
 * The options of a free-form reaction prompt.
 *
 * @since 1.0.0
 */
export interface IMessagePrompterReactionStrategyOptions
	extends IMessagePrompterStrategyOptions {
	/**
	 * The emoji to offer. At least one is required.
	 */
	reactions: string[] | EmojiIdentifierResolvable[];
}

/**
 * What each built-in strategy resolves with, keyed by the name it is registered under.
 *
 * @since 1.0.0
 */
export interface StrategyReturns {
	confirm: IMessagePrompterExplicitConfirmReturn | boolean;
	message: IMessagePrompterExplicitMessageReturn | Message;
	number: IMessagePrompterExplicitNumberReturn | number;
	reaction: IMessagePrompterExplicitReturnBase | string | EmojiResolvable;
}

/**
 * What each built-in strategy accepts as options, keyed by the name it is registered under.
 *
 * @since 1.0.0
 */
export interface StrategyOptions {
	confirm: IMessagePrompterConfirmStrategyOptions;
	message: IMessagePrompterStrategyOptions;
	number: IMessagePrompterNumberStrategyOptions;
	reaction: IMessagePrompterReactionStrategyOptions;
}

/**
 * The arguments each built-in strategy hands to a user-supplied collector filter.
 *
 * @since 1.0.0
 */
export interface StrategyFilters {
	confirm: [MessageReaction, User];
	message: [Message];
	number: [MessageReaction, User];
	reaction: [MessageReaction, User];
}

/**
 * The shape of a class that can be registered in `MessagePrompter.strategies`, permissive enough to
 * accept any of the built-in strategies.
 *
 * @since 1.0.0
 */
export type MessagePrompterStrategyConstructor = Ctor<
	| ConstructorParameters<typeof MessagePrompterConfirmStrategy>
	| ConstructorParameters<typeof MessagePrompterNumberStrategy>
	| ConstructorParameters<typeof MessagePrompterReactionStrategy>
	| ConstructorParameters<typeof MessagePrompterMessageStrategy>,
	| MessagePrompterConfirmStrategy
	| MessagePrompterNumberStrategy
	| MessagePrompterReactionStrategy
	| MessagePrompterMessageStrategy
>;

// #endregion

// #region PaginatedMessage

/**
 * Any component a {@link PaginatedMessage} can attach to its pages.
 *
 * @since 1.0.0
 */
export type PaginatedMessageAction =
	| PaginatedMessageActionButton
	| PaginatedMessageActionLink
	| PaginatedMessageActionStringMenu
	| PaginatedMessageActionUserMenu
	| PaginatedMessageActionRoleMenu
	| PaginatedMessageActionMentionableMenu
	| PaginatedMessageActionChannelMenu;

/**
 * The callback half of an action — everything except the component data itself.
 *
 * @since 1.0.0
 */
export interface PaginatedMessageActionRun {
	/**
	 * Invoked when a user interacts with this component.
	 *
	 * @param context Everything about the interaction: who triggered it, on which handler, and the
	 * collector currently listening.
	 */
	run?(context: PaginatedMessageActionContext): Awaitable<unknown>;
}

/**
 * A clickable button paired with the handler that runs when it is pressed.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const stopAction: PaginatedMessageActionButton = {
 *   customId: "CustomStopAction",
 *   emoji: "⏹️",
 *   type: ComponentType.Button,
 *   style: ButtonStyle.Danger,
 *   run: ({ collector }) => collector.stop()
 * };
 * ```
 */
export type PaginatedMessageActionButton = InteractionButtonComponentData &
	PaginatedMessageActionRun;

/**
 * A button that simply opens a URL. Discord never sends an interaction for these, so they carry no
 * `run` callback.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const documentation: PaginatedMessageActionLink = {
 *   url: "https://discord.js.org",
 *   label: "Documentation",
 *   emoji: "🔗",
 *   type: ComponentType.Button,
 *   style: ButtonStyle.Link
 * };
 * ```
 */
export type PaginatedMessageActionLink = LinkButtonComponentData;

/**
 * A select menu of plain string options.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const stringMenu: PaginatedMessageActionStringMenu = {
 *   customId: "CustomStringSelectMenu",
 *   type: ComponentType.StringSelect,
 *   options: [],
 *   run: ({ handler, interaction }) => interaction.isStringSelectMenu() && (handler.index = Number(interaction.values[0]))
 * };
 * ```
 */
export type PaginatedMessageActionStringMenu = PaginatedMessageActionRun &
	StringSelectMenuComponentData;

/**
 * A select menu that lets the user pick users. Discord populates the choices itself, hence
 * `options` is forbidden.
 *
 * @since 1.0.0
 */
export type PaginatedMessageActionUserMenu = PaginatedMessageActionRun &
	UserSelectMenuComponentData & {
		options?: never;
	};

/**
 * A select menu that lets the user pick roles. Discord populates the choices itself, hence
 * `options` is forbidden.
 *
 * @since 1.0.0
 */
export type PaginatedMessageActionRoleMenu = PaginatedMessageActionRun &
	RoleSelectMenuComponentData & {
		options?: never;
	};

/**
 * A select menu that lets the user pick users or roles. Discord populates the choices itself, hence
 * `options` is forbidden.
 *
 * @since 1.0.0
 */
export type PaginatedMessageActionMentionableMenu = PaginatedMessageActionRun &
	MentionableSelectMenuComponentData & {
		options?: never;
	};

/**
 * A select menu that lets the user pick channels. Discord populates the choices itself, hence
 * `options` is forbidden.
 *
 * @since 1.0.0
 */
export type PaginatedMessageActionChannelMenu = PaginatedMessageActionRun &
	ChannelSelectMenuComponentData & {
		options?: never;
	};

/**
 * Everything an action's `run` callback is given when a user interacts with it.
 *
 * @since 1.0.0
 */
export interface PaginatedMessageActionContext {
	/**
	 * The interaction that triggered this action.
	 */
	interaction: PaginatedMessageInteractionUnion;

	/**
	 * The handler the action belongs to. Mutate `handler.index` to change the page.
	 */
	handler: PaginatedMessage;

	/**
	 * The user the handler was opened for.
	 */
	author: User;

	/**
	 * The channel the handler is running in.
	 */
	channel: Message["channel"];

	/**
	 * Whatever the handler is currently editing to show its pages.
	 */
	response:
		| APIMessage
		| Message
		| CommandInteraction
		| ButtonInteraction
		| PaginatedMessageInteractionUnion;

	/**
	 * The collector listening for further interactions. Call `stop()` on it to close the handler.
	 */
	collector: InteractionCollector<PaginatedMessageInteractionUnion>;
}

/**
 * Everything the {@link PaginatedMessage} constructor accepts.
 *
 * @since 1.0.0
 */
export interface PaginatedMessageOptions {
	/**
	 * The pages to start with.
	 */
	pages?: PaginatedMessagePage[];

	/**
	 * The components to attach. Leaving this out uses the handler's default actions.
	 */
	actions?: PaginatedMessageAction[];

	/**
	 * A message or embed whose values are merged underneath every page.
	 */
	template?: EmbedBuilder | BaseMessageOptions;

	/**
	 * Text placed in front of the `current / total` counter in the embed footer.
	 */
	pageIndexPrefix?: string;

	/**
	 * The separator drawn between the page counter and whatever footer text the page already had.
	 */
	embedFooterSeparator?: string;

	/**
	 * Extra message options merged into every outgoing payload.
	 *
	 * @remarks This is an advanced escape hatch — a careless value here can produce messages
	 * Discord rejects.
	 *
	 * @default null
	 */
	paginatedMessageData?: Omit<
		PaginatedMessageMessageOptionsUnion,
		"components"
	> | null;
}

/**
 * One page of a {@link PaginatedMessage}: either a ready-made message payload, or a callback that
 * builds one on demand.
 *
 * Prefer the `addPage*` helpers over hand-writing these — the handler post-processes each page and
 * only those helpers guarantee the result is shaped the way it expects.
 *
 * @since 1.0.0
 */
export type PaginatedMessagePage =
	| ((
			index: number,
			pages: PaginatedMessagePage[],
			handler: PaginatedMessage,
	  ) => Awaitable<PaginatedMessageMessageOptionsUnion>)
	| PaginatedMessageMessageOptionsUnion;

/**
 * A page after the handler has resolved it, with `flags` stripped because the handler sets those
 * itself.
 *
 * @since 1.0.0
 */
export type PaginatedMessageResolvedPage =
	| Omit<BaseMessageOptions, "flags">
	| Omit<WebhookMessageEditOptions, "flags">;

/**
 * Builds the label and description of one entry in the "go to page" select menu. The `value` is
 * deliberately not yours to set — the handler relies on it to know which page was picked.
 *
 * @since 1.0.0
 */
export type PaginatedMessageSelectMenuOptionsFunction = (
	pageIndex: number,
	internationalizationContext: PaginatedMessageInternationalizationContext,
) => Awaitable<Omit<SelectMenuComponentOptionData, "value">>;

/**
 * Builds the reply sent to somebody who presses buttons that were not meant for them.
 *
 * @since 1.0.0
 */
export type PaginatedMessageWrongUserInteractionReplyFunction = (
	targetUser: User,
	interactionUser: User,
	internationalizationContext: PaginatedMessageInternationalizationContext,
) => Awaitable<Parameters<MessageComponentInteraction["reply"]>[0]>;

/**
 * Whatever discord.js accepts in a message's `embeds` array.
 *
 * @since 1.0.0
 */
export type PaginatedMessageEmbedResolvable = BaseMessageOptions["embeds"];

/**
 * {@link PaginatedMessageEmbedResolvable} without the `undefined` union member and without the
 * `readonly` constraint, so the handler can build one up entry by entry.
 *
 * @since 1.0.0
 */
export type PaginatedMessageWriteableEmbedResolvable = (
	| APIEmbed
	| JSONEncodable<APIEmbed>
)[];

/**
 * A page payload before the handler attaches components to it. Per-page actions ride along under
 * `actions`.
 *
 * @since 1.0.0
 */
export type PaginatedMessageMessageOptionsUnion = Omit<
	PaginatedMessageResolvedPage,
	"components"
> & {
	actions?: PaginatedMessageAction[];
};

/**
 * Every interaction a {@link PaginatedMessage} collector can receive. Modal submissions are
 * excluded because the handler never opens a modal.
 *
 * @since 1.0.0
 */
export type PaginatedMessageInteractionUnion = Exclude<
	CollectedInteraction,
	ModalSubmitInteraction
>;

/**
 * An action row in any of the three forms discord.js will accept when a message is sent.
 *
 * @since 1.0.0
 */
export type PaginatedMessageComponentUnion =
	| JSONEncodable<APIActionRowComponent<APIComponentInMessageActionRow>>
	| ActionRowData<ActionRowComponentOptions | MessageActionRowComponentBuilder>
	| APIActionRowComponent<APIComponentInMessageActionRow>;

/**
 * The context handed to {@link PaginatedMessageSelectMenuOptionsFunction} and
 * {@link PaginatedMessageWrongUserInteractionReplyFunction} so they can localise their output per
 * guild, per channel or per user.
 *
 * @since 1.0.0
 */
export interface PaginatedMessageInternationalizationContext {
	/**
	 * The guild to resolve a language for, or `null` when the handler is running in a DM.
	 */
	guild: Guild | null;

	/**
	 * The channel to resolve a language for.
	 */
	channel: Message["channel"] | StageChannel | VoiceChannel | null;

	/**
	 * The user to resolve a language for.
	 */
	user: User | null;

	/**
	 * The guild locale Discord reported on the interaction, when there was one.
	 */
	interactionGuildLocale?: Interaction["guildLocale"];

	/**
	 * The user locale Discord reported on the interaction, when there was one.
	 */
	interactionLocale?: Interaction["locale"];
}

/**
 * The four payloads `safelyReplyToInteraction` needs in order to respond correctly no matter which
 * of the many possible states the target is in.
 *
 * @since 1.0.0
 */
export interface SafeReplyToInteractionParameters<
	T extends "edit" | "reply" = never,
> {
	/**
	 * The message or interaction being responded to.
	 */
	messageOrInteraction: APIMessage | Message | AnyInteractableInteraction;

	/**
	 * Used when the interaction was already replied to or deferred.
	 */
	interactionEditReplyContent: WebhookMessageEditOptions;

	/**
	 * Used when the interaction has not been responded to yet.
	 */
	interactionReplyContent: InteractionReplyOptions;

	/**
	 * Used when the interaction came from a component and can be updated in place.
	 */
	componentUpdateContent: InteractionUpdateOptions;

	/**
	 * Which method to call when the target turns out to be a plain message.
	 */
	messageMethod?: T;

	/**
	 * The payload for `messageMethod`.
	 */
	messageMethodContent?: T extends "reply"
		? MessageReplyOptions
		: MessageEditOptions;
}

/**
 * Every reason discord.js reports when an interaction collector ends.
 *
 * @since 1.0.0
 */
export type PaginatedMessageStopReasons =
	| "time"
	| "idle"
	| "user"
	| "messageDelete"
	| "channelDelete"
	| "threadDelete"
	| "guildDelete"
	| "limit"
	| "componentLimit"
	| "userLimit";

/**
 * An embed in either of the two forms discord.js accepts: a raw API object, or a builder that can
 * serialise itself into one.
 *
 * @since 1.0.0
 */
export type EmbedResolvable = JSONEncodable<APIEmbed> | APIEmbed;

// #endregion
