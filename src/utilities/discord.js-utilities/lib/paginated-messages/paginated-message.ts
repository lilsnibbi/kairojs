import type {
	AnyInteractableInteraction,
	Awaitable,
	EmbedResolvable,
	PaginatedMessageAction,
	PaginatedMessageComponentUnion,
	PaginatedMessageEmbedResolvable,
	PaginatedMessageInteractionUnion,
	PaginatedMessageInternationalizationContext,
	PaginatedMessageMessageOptionsUnion,
	PaginatedMessageOptions,
	PaginatedMessagePage,
	PaginatedMessageResolvedPage,
	PaginatedMessageSelectMenuOptionsFunction,
	PaginatedMessageStopReasons,
	PaginatedMessageWriteableEmbedResolvable,
	PaginatedMessageWrongUserInteractionReplyFunction,
} from "@types";
import { Time } from "@utilities/duration/index.ts";
import {
	deepClone,
	isFunction,
	isNullish,
	isObject,
} from "@utilities/utilities/index.ts";
import {
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ComponentType,
	EmbedBuilder,
	GatewayIntentBits,
	IntentsBitField,
	InteractionCollector,
	InteractionType,
	MentionableSelectMenuBuilder,
	MessageFlags,
	Partials,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
	UserSelectMenuBuilder,
	isJSONEncodable,
	userMention,
	type APIEmbed,
	type BaseMessageOptions,
	type Collection,
	type JSONEncodable,
	type Message,
	type MessageActionRowComponentBuilder,
	type Snowflake,
	type User,
} from "discord.js";
import { MessageBuilder } from "../builders/message-builder.ts";
import {
	isAnyInteraction,
	isGuildBasedChannel,
	isMessageInstance,
	isTextBasedChannel,
} from "../type-guards.ts";
import {
	actionIsButtonOrMenu,
	actionIsLinkButton,
	createPartitionedMessageRow,
	isMessageButtonInteractionData,
	isMessageChannelSelectInteractionData,
	isMessageMentionableSelectInteractionData,
	isMessageRoleSelectInteractionData,
	isMessageStringSelectInteractionData,
	isMessageUserSelectInteractionData,
	safelyReplyToInteraction,
} from "./utils.ts";

/**
 * The `customId` of the built-in select menu that jumps straight to a page. The handler recognises
 * this value and fills the menu's options in for you.
 */
const goToPageCustomId = "@kairojs/paginated-messages.goToPage";

/**
 * Turns a list of pages into a single message the reader steps through with buttons and a select
 * menu, editing that one message in place rather than flooding the channel.
 *
 * Use this class directly or extend it. Almost every knob has both a static and an instance form:
 * assign to the static during start-up to change every paginator in your bot, or call the matching
 * `set*` method to change just one.
 *
 * @remarks For this to work in DMs your client needs `Partials.Channel` in `client.options.partials`.
 * Message-based commands additionally need the `DirectMessages` intent; chat input commands only
 * work in DMs when they are registered globally.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
 * import { EmbedBuilder } from "discord.js";
 *
 * const paginated = new PaginatedMessage();
 *
 * paginated.addPageEmbed((embed) => embed.setColor("#FF0000").setDescription("The first page"));
 *
 * paginated.addPageBuilder((builder) =>
 *   builder.setContent("Some text").setEmbeds([new EmbedBuilder().setDescription("The second page")])
 * );
 *
 * paginated.addPageContent("The third page");
 *
 * await paginated.run(message);
 * ```
 *
 * @remarks A template is merged underneath every page, with the page's own values winning. A
 * template footer is appended _after_ the page counter, separated by a space — so a template footer
 * of `- brought to you by my bot` renders as `1/2 - brought to you by my bot`.
 *
 * @example
 * ```typescript
 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
 * import { EmbedBuilder } from "discord.js";
 *
 * const paginated = new PaginatedMessage({
 *   template: new EmbedBuilder().setColor("#FF0000").setFooter({ text: "- brought to you by my bot" })
 * });
 * ```
 */
export class PaginatedMessage {
	// #region public static class properties

	/**
	 * The components every new handler starts with: a "go to page" select menu, first/previous/next/last
	 * buttons, and a stop button.
	 */
	public static defaultActions: PaginatedMessageAction[] = [
		{
			customId: goToPageCustomId,
			type: ComponentType.StringSelect,
			options: [],
			run: ({ handler, interaction }) => {
				if (interaction.isStringSelectMenu()) {
					handler.index = parseInt(interaction.values[0]!, 10);
				}
			},
		},
		{
			customId: "@kairojs/paginated-messages.firstPage",
			style: ButtonStyle.Primary,
			emoji: "⏪",
			type: ComponentType.Button,
			run: ({ handler }) => (handler.index = 0),
		},
		{
			customId: "@kairojs/paginated-messages.previousPage",
			style: ButtonStyle.Primary,
			emoji: "◀️",
			type: ComponentType.Button,
			run: ({ handler }) => {
				if (handler.index === 0) {
					handler.index = handler.pages.length - 1;
				} else {
					--handler.index;
				}
			},
		},
		{
			customId: "@kairojs/paginated-messages.nextPage",
			style: ButtonStyle.Primary,
			emoji: "▶️",
			type: ComponentType.Button,
			run: ({ handler }) => {
				if (handler.index === handler.pages.length - 1) {
					handler.index = 0;
				} else {
					++handler.index;
				}
			},
		},
		{
			customId: "@kairojs/paginated-messages.goToLastPage",
			style: ButtonStyle.Primary,
			emoji: "⏩",
			type: ComponentType.Button,
			run: ({ handler }) => (handler.index = handler.pages.length - 1),
		},
		{
			customId: "@kairojs/paginated-messages.stop",
			style: ButtonStyle.Danger,
			emoji: "⏹️",
			type: ComponentType.Button,
			run: ({ collector }) => {
				collector.stop();
			},
		},
	];

	/**
	 * Whether to warn when a handler is opened in a DM by a client that lacks the `Channel` partial,
	 * which is the one configuration mistake that silently breaks pagination.
	 *
	 * @remarks Message-based commands additionally need the `DirectMessages` intent.
	 *
	 * Set this in the same file you call `client.login()` from, or override it per handler with
	 * {@link PaginatedMessage.setEmitPartialDMChannelWarning}.
	 *
	 * @default true
	 */
	public static emitPartialDMChannelWarning = true;

	/**
	 * The `customId` values that close a handler rather than turning a page. The handler skips its
	 * usual "redraw the current page" step for these.
	 *
	 * Set this in the same file you call `client.login()` from, or override it per handler with
	 * {@link PaginatedMessage.setStopPaginatedMessageCustomIds}.
	 *
	 * @default ['@kairojs/paginated-messages.stop']
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * PaginatedMessage.stopPaginatedMessageCustomIds = ["my-custom-stop-custom-id"];
	 * ```
	 */
	public static stopPaginatedMessageCustomIds = [
		"@kairojs/paginated-messages.stop",
	];

	/**
	 * The collector end reasons that mean the message is already gone, in which case there is
	 * nothing left to strip the components from.
	 */
	public static deletionStopReasons = [
		"messageDelete",
		"channelDelete",
		"guildDelete",
	];

	/**
	 * Text placed in front of the page counter in the embed footer. A space is added after it for
	 * you.
	 *
	 * Set this in the same file you call `client.login()` from.
	 *
	 * @default ""
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * PaginatedMessage.pageIndexPrefix = "Page";
	 * // Footers now read "Page 1/2"
	 * ```
	 */
	public static pageIndexPrefix = "";

	/**
	 * The separator drawn between the page counter and whatever footer text the page already had.
	 *
	 * Set this in the same file you call `client.login()` from, or override it per handler by
	 * passing `embedFooterSeparator` to the constructor.
	 *
	 * @default "•"
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * PaginatedMessage.embedFooterSeparator = "|";
	 * // Footers now read "1/2 | Today at 4:20"
	 * ```
	 */
	public static embedFooterSeparator = "•";

	/**
	 * Every handler currently listening, keyed by the id of the message it is drawn on.
	 *
	 * This is what stops two handlers from fighting over one message, which matters when your bot
	 * re-runs commands on edit.
	 */
	public static readonly messages = new Map<string, PaginatedMessage>();

	/**
	 * Every handler currently listening, keyed by the id of the user it was opened for.
	 *
	 * Opening a second handler for the same user closes the first, so nobody can leave a dozen
	 * collectors running.
	 */
	public static readonly handlers = new Map<string, PaginatedMessage>();

	/**
	 * Builds the label and description of one entry in the "go to page" select menu.
	 *
	 * The `value` is deliberately not yours to set — the handler reads it back to learn which page
	 * was picked. The index you receive is already one-based, matching what the reader sees.
	 *
	 * Set this in the same file you call `client.login()` from.
	 *
	 * @default
	 * ```ts
	 * (pageIndex) => ({ label: `Page ${pageIndex}` })
	 * ```
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * PaginatedMessage.selectMenuOptions = (pageIndex) => ({
	 *   label: `Go to page: ${pageIndex}`,
	 *   description: "This is a description"
	 * });
	 * ```
	 */
	public static selectMenuOptions: PaginatedMessageSelectMenuOptionsFunction = (
		pageIndex,
	) => ({ label: `Page ${pageIndex}` });

	/**
	 * Builds the reply sent to somebody who presses buttons that were not meant for them.
	 *
	 * Keep it ephemeral so only the person clicking sees it, and keep `allowedMentions` empty so a
	 * mention in the text cannot turn into a ping. Returning a bare string gets both of those
	 * applied for you.
	 *
	 * Set this in the same file you call `client.login()` from.
	 *
	 * @default
	 * ```ts
	 * {
	 *   content: `Please stop interacting with the components on this message. They are only for ${userMention(targetUser.id)}.`,
	 *   flags: MessageFlags.Ephemeral,
	 *   allowedMentions: { users: [], roles: [] }
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 * import { userMention } from "discord.js";
	 *
	 * PaginatedMessage.wrongUserInteractionReply = (targetUser) =>
	 *   `These buttons are only for ${userMention(targetUser.id)}.`;
	 * ```
	 */
	public static wrongUserInteractionReply: PaginatedMessageWrongUserInteractionReplyFunction =
		(targetUser: User) => ({
			content: `Please stop interacting with the components on this message. They are only for ${userMention(targetUser.id)}.`,
			flags: MessageFlags.Ephemeral,
			allowedMentions: { users: [], roles: [] },
		});
	// #endregion

	// #region private static class properties
	/**
	 * Normalises a constructor template into plain message options: an embed builder becomes a
	 * one-entry `embeds` array, anything else is already in the right shape.
	 */
	private static resolveTemplate(
		template?: JSONEncodable<APIEmbed> | BaseMessageOptions,
	): BaseMessageOptions {
		if (template === undefined) {
			return {};
		}

		if (isJSONEncodable(template)) {
			return { embeds: [template.toJSON()] };
		}

		return template;
	}
	// #endregion

	// #region public class properties
	/**
	 * The pages as you supplied them, before the handler resolved and decorated them.
	 */
	public pages: PaginatedMessagePage[] = [];

	/**
	 * Whatever the handler is currently editing to show its pages.
	 */
	public response: Message | AnyInteractableInteraction | null = null;

	/**
	 * The collector listening for component interactions, or `null` while the handler is not
	 * running.
	 */
	public collector: InteractionCollector<PaginatedMessageInteractionUnion> | null =
		null;

	/**
	 * The fully resolved pages, with template, footer and components already applied. Entries stay
	 * `null` until the page they belong to is first needed.
	 */
	public messages: (PaginatedMessageResolvedPage | null)[] = [];

	/**
	 * The components shown on every page, keyed by `customId` — or by `url` for link buttons.
	 */
	public actions = new Map<string, PaginatedMessageAction>();

	/**
	 * Extra components shown on one page only, indexed by page.
	 */
	public pageActions: (Map<string, PaginatedMessageAction> | null)[] = [];

	/**
	 * The page currently on screen, zero-based.
	 */
	public index = 0;

	/**
	 * How long, in milliseconds, the handler waits without interaction before closing.
	 *
	 * @remarks The default sits just under Discord's fifteen-minute interaction token lifetime, so
	 * the handler closes itself while it can still edit its own message.
	 *
	 * @default 14.5 minutes
	 */
	public idle = Time.Minute * 14.5;

	/**
	 * Values merged underneath every page of this handler, with each page's own values winning.
	 */
	public template: PaginatedMessageMessageOptionsUnion;

	/**
	 * Text placed in front of the page counter in the embed footer. A space is added after it for
	 * you.
	 *
	 * @default {@link PaginatedMessage.pageIndexPrefix}
	 */
	public pageIndexPrefix = PaginatedMessage.pageIndexPrefix;

	/**
	 * The separator drawn between the page counter and whatever footer text the page already had.
	 *
	 * @default {@link PaginatedMessage.embedFooterSeparator}
	 */
	public embedFooterSeparator = PaginatedMessage.embedFooterSeparator;

	/**
	 * The `customId` values that close this handler rather than turning a page.
	 *
	 * @default {@link PaginatedMessage.stopPaginatedMessageCustomIds}
	 */
	public stopPaginatedMessageCustomIds =
		PaginatedMessage.stopPaginatedMessageCustomIds;

	/**
	 * Whether to warn when this handler is opened in a DM by a client that lacks the `Channel`
	 * partial.
	 *
	 * @default {@link PaginatedMessage.emitPartialDMChannelWarning}
	 */
	public emitPartialDMChannelWarning =
		PaginatedMessage.emitPartialDMChannelWarning;
	// #endregion

	// #region protected class properties
	/**
	 * Extra message options merged into every outgoing payload. An advanced escape hatch — a
	 * careless value here can produce messages Discord rejects.
	 */
	protected paginatedMessageData: Omit<
		PaginatedMessageMessageOptionsUnion,
		"components"
	> | null = null;

	/**
	 * The greyed-out text shown in the "go to page" select menu before anything is picked.
	 */
	protected selectMenuPlaceholder: string | undefined = undefined;

	/**
	 * Whether the "too many pages" warning has already been logged, so it is only ever shown once
	 * per handler.
	 *
	 * @default false
	 */
	protected hasEmittedMaxPageWarning = false;

	/**
	 * Whether the "missing DM partial" warning has already been logged, so it is only ever shown
	 * once per handler.
	 *
	 * @default false
	 */
	protected hasEmittedPartialDMChannelWarning = false;

	/**
	 * Whether the page counter is appended to each page's last embed footer.
	 *
	 * @remarks Turning this off also means {@link PaginatedMessage.embedFooterSeparator} is never
	 * used, since there is no counter left to separate anything from.
	 *
	 * @default true
	 */
	protected shouldAddFooterToEmbeds = true;

	/**
	 * This handler's own version of {@link PaginatedMessage.selectMenuOptions}.
	 */
	protected selectMenuOptions: PaginatedMessageSelectMenuOptionsFunction =
		PaginatedMessage.selectMenuOptions;

	/**
	 * This handler's own version of {@link PaginatedMessage.wrongUserInteractionReply}.
	 */
	protected wrongUserInteractionReply: PaginatedMessageWrongUserInteractionReplyFunction =
		PaginatedMessage.wrongUserInteractionReply;
	// #endregion

	// #region private class fields
	/** Sent whenever the handler is asked to respond but has nothing sensible left to say. */
	readonly #deadEndContent = {
		content: "This maze wasn't meant for you...what did you do.",
	};
	// #endregion

	/**
	 * @param options The pages, actions and presentation settings to start from.
	 */
	public constructor({
		pages,
		actions,
		template,
		pageIndexPrefix,
		embedFooterSeparator,
		paginatedMessageData = null,
	}: PaginatedMessageOptions = {}) {
		if (pages) this.addPages(pages);

		this.addActions(
			actions ?? (this.constructor as typeof PaginatedMessage).defaultActions,
		);

		this.template = PaginatedMessage.resolveTemplate(template);
		this.pageIndexPrefix = pageIndexPrefix ?? PaginatedMessage.pageIndexPrefix;
		this.embedFooterSeparator =
			embedFooterSeparator ?? PaginatedMessage.embedFooterSeparator;
		this.paginatedMessageData = paginatedMessageData;
	}

	// #region property setters
	/**
	 * Overrides {@link PaginatedMessage.selectMenuOptions} for this handler alone.
	 *
	 * @param newOptions The generator to use instead.
	 */
	public setSelectMenuOptions(
		newOptions: PaginatedMessageSelectMenuOptionsFunction,
	): this {
		this.selectMenuOptions = newOptions;
		return this;
	}

	/**
	 * Sets the greyed-out text shown in the "go to page" select menu before anything is picked.
	 *
	 * This only affects the built-in select menu — the handler recognises it by its `customId`.
	 *
	 * @param placeholder The placeholder text, or `undefined` for none.
	 */
	public setSelectMenuPlaceholder(placeholder: string | undefined): this {
		this.selectMenuPlaceholder = placeholder;
		return this;
	}

	/**
	 * Overrides {@link PaginatedMessage.wrongUserInteractionReply} for this handler alone.
	 *
	 * @param wrongUserInteractionReply The generator to use instead.
	 */
	public setWrongUserInteractionReply(
		wrongUserInteractionReply: PaginatedMessageWrongUserInteractionReplyFunction,
	): this {
		this.wrongUserInteractionReply = wrongUserInteractionReply;
		return this;
	}

	/**
	 * Overrides {@link PaginatedMessage.stopPaginatedMessageCustomIds} for this handler alone.
	 *
	 * @param stopPaginatedMessageCustomIds The `customId` values that should close this handler.
	 */
	public setStopPaginatedMessageCustomIds(
		stopPaginatedMessageCustomIds: string[],
	): this {
		this.stopPaginatedMessageCustomIds = stopPaginatedMessageCustomIds;
		return this;
	}

	/**
	 * Overrides {@link PaginatedMessage.emitPartialDMChannelWarning} for this handler alone.
	 *
	 * @param emitPartialDMChannelWarning Whether to warn about a missing `Channel` partial.
	 */
	public setEmitPartialDMChannelWarning(
		emitPartialDMChannelWarning: boolean,
	): this {
		this.emitPartialDMChannelWarning = emitPartialDMChannelWarning;
		return this;
	}

	/**
	 * Sets which page the handler opens on.
	 *
	 * @param index The zero-based page index.
	 */
	public setIndex(index: number): this {
		this.index = index;
		return this;
	}

	/**
	 * Sets how long the handler waits without interaction before closing.
	 *
	 * @param idle The idle window in milliseconds.
	 */
	public setIdle(idle: number): this {
		this.idle = idle;
		return this;
	}

	/**
	 * Sets whether the page counter is appended to each page's last embed footer.
	 *
	 * @param newValue Whether to add the footer.
	 */
	public setShouldAddFooterToEmbeds(newValue: boolean): this {
		this.shouldAddFooterToEmbeds = newValue;
		return this;
	}
	// #endregion

	// #region actions related methods
	/**
	 * Throws away every existing action and installs these instead. They appear in the order given.
	 *
	 * @param actions The buttons, link buttons and select menus to install.
	 * @param includeDefaultActions Whether to put {@link PaginatedMessage.defaultActions} in front
	 * of them. Defaults to `false`, so pagination controls disappear unless you ask for them.
	 *
	 * @example Keeping the default controls by spreading them in yourself.
	 * ```typescript
	 * const display = new PaginatedMessage();
	 *
	 * display.setActions([...PaginatedMessage.defaultActions]);
	 * ```
	 *
	 * @example A button needs `style`, `customId`, `type`, `run` and at least one of `label` or `emoji`.
	 * ```typescript
	 * import { ButtonStyle, ComponentType } from "discord.js";
	 *
	 * display.setActions(
	 *   [
	 *     {
	 *       style: ButtonStyle.Primary,
	 *       label: "My Button",
	 *       customId: "custom_button",
	 *       type: ComponentType.Button,
	 *       run: (context) => console.log(context)
	 *     }
	 *   ],
	 *   true
	 * );
	 * ```
	 *
	 * @example A link button needs `style`, `url`, `type` and at least one of `label` or `emoji`.
	 * ```typescript
	 * import { ButtonStyle, ComponentType } from "discord.js";
	 *
	 * display.setActions(
	 *   [
	 *     {
	 *       style: ButtonStyle.Link,
	 *       label: "Documentation",
	 *       emoji: "🔷",
	 *       url: "https://discord.js.org",
	 *       type: ComponentType.Button
	 *     }
	 *   ],
	 *   true
	 * );
	 * ```
	 *
	 * @example A select menu needs `customId`, `type` and `run`.
	 * ```typescript
	 * import { ComponentType } from "discord.js";
	 *
	 * display.setActions(
	 *   [
	 *     {
	 *       customId: "custom_menu",
	 *       type: ComponentType.StringSelect,
	 *       options: [],
	 *       run: (context) => console.log(context)
	 *     }
	 *   ],
	 *   true
	 * );
	 * ```
	 */
	public setActions(
		actions: PaginatedMessageAction[],
		includeDefaultActions = false,
	): this {
		this.actions.clear();
		return this.addActions([
			...(includeDefaultActions ? PaginatedMessage.defaultActions : []),
			...actions,
		]);
	}

	/**
	 * Appends actions to the ones already installed, in the order given.
	 *
	 * @param actions The actions to append.
	 *
	 * @see {@link PaginatedMessage.setActions} for how to shape each one.
	 */
	public addActions(actions: PaginatedMessageAction[]): this {
		for (const action of actions) this.addAction(action);
		return this;
	}

	/**
	 * Appends one action, which ends up last.
	 *
	 * @param action The action to append.
	 *
	 * @see {@link PaginatedMessage.setActions} for how to shape it.
	 */
	public addAction(action: PaginatedMessageAction): this {
		if (actionIsLinkButton(action)) {
			this.actions.set(action.url, action);
		} else if (actionIsButtonOrMenu(action)) {
			this.actions.set(action.customId, action);
		}

		return this;
	}
	// #endregion

	// #region page related methods
	/**
	 * Whether a page exists at the given index.
	 *
	 * @param index The zero-based page index.
	 */
	public hasPage(index: number): boolean {
		return index >= 0 && index < this.pages.length;
	}

	/**
	 * Throws away every existing page and installs these instead, in the order given.
	 *
	 * @param pages The pages to install.
	 */
	public setPages(pages: PaginatedMessagePage[]) {
		this.pages = [];
		this.messages = [];
		this.addPages(pages);
		return this;
	}

	/**
	 * Appends one page, which ends up last.
	 *
	 * @remarks {@link PaginatedMessage.addPageBuilder}, {@link PaginatedMessage.addPageContent} and
	 * {@link PaginatedMessage.addPageEmbed} are almost always what you actually want — this is the
	 * raw form they build on.
	 *
	 * @param page The page to append. Anything past the twenty-fifth is dropped with a warning,
	 * because the "go to page" select menu cannot hold more entries than that.
	 */
	public addPage(page: PaginatedMessagePage): this {
		if (this.pages.length === 25) {
			if (!this.hasEmittedMaxPageWarning) {
				console.warn(
					[
						"PaginatedMessage was given more than 25 pages; every page past the 25th is being dropped.",
						"Check the instance and make sure it does not exceed 25 pages in total.",
						"If you genuinely need more, extend the class and replace the actions in your constructor.",
					].join("\n"),
				);
				this.hasEmittedMaxPageWarning = true;
			}

			return this;
		}

		this.pages.push(page);

		return this;
	}

	/**
	 * Replaces the page currently on screen and redraws it immediately.
	 *
	 * @param page The replacement page.
	 *
	 * @throws If the handler has not been run yet, since there is nothing to redraw.
	 */
	public async updateCurrentPage(page: PaginatedMessagePage): Promise<this> {
		const interaction = this.response;
		const currentIndex = this.index;

		if (interaction === null) {
			throw new Error(
				"You cannot update a page before responding to the interaction.",
			);
		}

		this.pages[currentIndex] = page;
		this.messages[currentIndex] = null;
		this.pageActions[currentIndex]?.clear();

		const target = isAnyInteraction(interaction)
			? interaction.user
			: interaction.author;
		await this.resolvePage(interaction, target, currentIndex);

		return this;
	}

	/**
	 * Appends a page built with a {@link MessageBuilder}, which ends up last.
	 *
	 * @param builder Either a ready-made builder, or a callback handed a fresh one.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 * import { EmbedBuilder } from "discord.js";
	 *
	 * const paginated = new PaginatedMessage().addPageBuilder((builder) =>
	 *   builder.setContent("Some text").setEmbeds([new EmbedBuilder().setDescription("An embed")])
	 * );
	 * ```
	 *
	 * @example
	 * ```typescript
	 * import { MessageBuilder, PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const builder = new MessageBuilder().setContent("Some text");
	 *
	 * const paginated = new PaginatedMessage().addPageBuilder(builder);
	 * ```
	 */
	public addPageBuilder(
		builder: MessageBuilder | ((builder: MessageBuilder) => MessageBuilder),
	): this {
		return this.addPage(
			isFunction(builder) ? builder(new MessageBuilder()) : builder,
		);
	}

	/**
	 * Appends a page built asynchronously with a {@link MessageBuilder}, which ends up last.
	 *
	 * @param builder Either a ready-made builder, or an async callback handed a fresh one.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 * import { EmbedBuilder } from "discord.js";
	 *
	 * const paginated = new PaginatedMessage().addAsyncPageBuilder(async (builder) => {
	 *   const response = await fetch("https://contoso.com/api/users");
	 *   const users = await response.json();
	 *
	 *   return builder.setEmbeds([new EmbedBuilder().setDescription(users.summary)]);
	 * });
	 * ```
	 */
	public addAsyncPageBuilder(
		builder:
			| MessageBuilder
			| ((builder: MessageBuilder) => Promise<MessageBuilder>),
	): this {
		return this.addPage(async () =>
			isFunction(builder) ? builder(new MessageBuilder()) : builder,
		);
	}

	/**
	 * Appends a page that is nothing but text, which ends up last.
	 *
	 * @param content The message content.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const paginated = new PaginatedMessage().addPageContent("Some text");
	 * ```
	 */
	public addPageContent(content: string): this {
		return this.addPage({ content });
	}

	/**
	 * Appends a page carrying a single embed, which ends up last.
	 *
	 * @param embed Either a ready-made embed, or a callback handed a fresh {@link EmbedBuilder}.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const paginated = new PaginatedMessage().addPageEmbed((embed) =>
	 *   embed.setColor("#FF0000").setDescription("An embed")
	 * );
	 * ```
	 */
	public addPageEmbed(
		embed: EmbedResolvable | ((embed: EmbedBuilder) => EmbedResolvable),
	): this {
		return this.addPage({
			embeds: isFunction(embed) ? [embed(new EmbedBuilder())] : [embed],
		});
	}

	/**
	 * Appends a page carrying a single embed built asynchronously, which ends up last.
	 *
	 * @param embed Either a ready-made embed, or an async callback handed a fresh
	 * {@link EmbedBuilder}.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const paginated = new PaginatedMessage().addAsyncPageEmbed(async (embed) => {
	 *   const response = await fetch("https://contoso.com/api/users");
	 *   const users = await response.json();
	 *
	 *   return embed.setColor("#FF0000").setDescription(users.summary);
	 * });
	 * ```
	 */
	public addAsyncPageEmbed(
		embed:
			| EmbedResolvable
			| ((builder: EmbedBuilder) => Awaitable<EmbedResolvable>),
	): this {
		return this.addPage(async () => ({
			embeds: isFunction(embed) ? [await embed(new EmbedBuilder())] : [embed],
		}));
	}

	/**
	 * Appends a page carrying several embeds, which ends up last.
	 *
	 * @remarks The callback form always constructs ten builders, used or not. If that cost bothers
	 * you, reach for {@link PaginatedMessage.addPageBuilder} and assemble the array yourself.
	 *
	 * @param embeds Either an array of ready-made embeds, or a callback handed ten fresh
	 * {@link EmbedBuilder} instances. More than ten is truncated to the first ten.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const paginated = new PaginatedMessage().addPageEmbeds((first, second) => [
	 *   first.setColor("#FF0000").setDescription("The first embed"),
	 *   second.setColor("#00FF00").setDescription("The second embed")
	 * ]);
	 * ```
	 */
	public addPageEmbeds(
		embeds:
			| EmbedResolvable[]
			| ((
					embed1: EmbedBuilder,
					embed2: EmbedBuilder,
					embed3: EmbedBuilder,
					embed4: EmbedBuilder,
					embed5: EmbedBuilder,
					embed6: EmbedBuilder,
					embed7: EmbedBuilder,
					embed8: EmbedBuilder,
					embed9: EmbedBuilder,
					embed10: EmbedBuilder,
			  ) => EmbedResolvable[]),
	): this {
		let resolvedEmbeds = isFunction(embeds)
			? embeds(
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
					new EmbedBuilder(),
				)
			: embeds;

		if (resolvedEmbeds.length > 10) {
			resolvedEmbeds = resolvedEmbeds.slice(0, 10);
		}

		return this.addPage({ embeds: resolvedEmbeds });
	}

	/**
	 * Appends a page carrying several embeds built asynchronously, which ends up last.
	 *
	 * @remarks The callback form always constructs ten builders, used or not. If that cost bothers
	 * you, reach for {@link PaginatedMessage.addAsyncPageBuilder} and assemble the array yourself.
	 *
	 * @param embeds Either an array of ready-made embeds, or an async callback handed ten fresh
	 * {@link EmbedBuilder} instances. More than ten is truncated to the first ten.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessage } from "kairojs/utilities/discord.js-utilities";
	 *
	 * const paginated = new PaginatedMessage().addAsyncPageEmbeds(async (first, second) => {
	 *   const response = await fetch("https://contoso.com/api/users");
	 *   const [alice, bob] = await response.json();
	 *
	 *   return [first.setAuthor({ name: alice.name }), second.setAuthor({ name: bob.name })];
	 * });
	 * ```
	 */
	public addAsyncPageEmbeds(
		embeds:
			| EmbedResolvable[]
			| ((
					embed1: EmbedBuilder,
					embed2: EmbedBuilder,
					embed3: EmbedBuilder,
					embed4: EmbedBuilder,
					embed5: EmbedBuilder,
					embed6: EmbedBuilder,
					embed7: EmbedBuilder,
					embed8: EmbedBuilder,
					embed9: EmbedBuilder,
					embed10: EmbedBuilder,
			  ) => Awaitable<EmbedResolvable[]>),
	): this {
		return this.addPage(async () => {
			let resolvedEmbeds = isFunction(embeds)
				? await embeds(
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
						new EmbedBuilder(),
					)
				: embeds;

			if (resolvedEmbeds.length > 10) {
				resolvedEmbeds = resolvedEmbeds.slice(0, 10);
			}

			return { embeds: resolvedEmbeds };
		});
	}

	/**
	 * Appends several pages, in the order given.
	 *
	 * @param pages The pages to append.
	 */
	public addPages(pages: PaginatedMessagePage[]): this {
		for (const page of pages) this.addPage(page);
		return this;
	}

	/**
	 * Throws away one page's extra actions and installs these instead.
	 *
	 * @remarks The index is bounds-checked against the pages that exist right now, so define your
	 * pages before you define their actions — otherwise every index is out of bounds.
	 *
	 * @param actions The actions to install on that page.
	 * @param index The zero-based page index.
	 *
	 * @throws If the index is out of bounds.
	 *
	 * @example Add a select menu to the first page without disturbing the shared controls.
	 * ```typescript
	 * import { ComponentType } from "discord.js";
	 *
	 * display.setPageActions(
	 *   [
	 *     {
	 *       customId: "custom_menu",
	 *       type: ComponentType.StringSelect,
	 *       options: [],
	 *       run: (context) => console.log(context)
	 *     }
	 *   ],
	 *   0
	 * );
	 * ```
	 *
	 * @see {@link PaginatedMessage.setActions} for how to shape each action.
	 */
	public setPageActions(
		actions: PaginatedMessageAction[],
		index: number,
	): this {
		if (index < 0 || index > this.pages.length - 1)
			throw new Error("Provided index is out of bounds");

		this.pageActions[index]?.clear();
		this.addPageActions(actions, index);
		return this;
	}

	/**
	 * Appends extra actions to one page.
	 *
	 * @remarks The index is bounds-checked against the pages that exist right now, so define your
	 * pages before you define their actions.
	 *
	 * @param actions The actions to append.
	 * @param index The zero-based page index.
	 *
	 * @throws If the index is out of bounds.
	 *
	 * @see {@link PaginatedMessage.setActions} for how to shape each action.
	 */
	public addPageActions(
		actions: PaginatedMessageAction[],
		index: number,
	): this {
		if (index < 0 || index > this.pages.length - 1)
			throw new Error("Provided index is out of bounds");

		for (const action of actions) {
			this.addPageAction(action, index);
		}

		return this;
	}

	/**
	 * Appends one extra action to one page.
	 *
	 * @remarks The index is bounds-checked against the pages that exist right now, so define your
	 * pages before you define their actions.
	 *
	 * @param action The action to append.
	 * @param index The zero-based page index.
	 *
	 * @throws If the index is out of bounds.
	 *
	 * @see {@link PaginatedMessage.setActions} for how to shape it.
	 */
	public addPageAction(action: PaginatedMessageAction, index: number): this {
		if (index < 0 || index > this.pages.length - 1)
			throw new Error("Provided index is out of bounds");

		const pageActionAtIndex =
			this.pageActions[index] ?? new Map<string, PaginatedMessageAction>();

		if (actionIsLinkButton(action)) {
			pageActionAtIndex.set(action.url, action);
		} else if (actionIsButtonOrMenu(action)) {
			pageActionAtIndex.set(action.customId, action);
		}

		this.pageActions[index] = pageActionAtIndex;

		return this;
	}
	// #endregion

	/**
	 * Draws the handler and starts listening for interactions.
	 *
	 * @remarks For this to work in DMs your client needs `Partials.Channel` in
	 * `client.options.partials`. Message-based commands additionally need the `DirectMessages`
	 * intent; chat input commands only work in DMs when they are registered globally.
	 *
	 * @param messageOrInteraction Whatever triggered the handler — usually a command message or an
	 * interaction, but it can also be an earlier message from your own client, which lets you turn
	 * a "loading…" placeholder into the finished paginator.
	 * @param target The only user allowed to press the buttons. Defaults to whoever triggered the
	 * handler.
	 *
	 * @throws If there are no pages, or no actions at all.
	 */
	public async run(
		messageOrInteraction: Message | AnyInteractableInteraction,
		target?: User,
	): Promise<this> {
		// Without a channel there is nowhere to draw, which in practice means an uncached DM.
		if (!messageOrInteraction.channel) {
			const isInteraction = isAnyInteraction(messageOrInteraction);
			let shouldWarn = this.emitPartialDMChannelWarning;

			// Never warn twice about the same handler.
			if (shouldWarn && this.hasEmittedPartialDMChannelWarning) {
				shouldWarn = false;
			}

			// An interaction only needs the Channel partial, and this client already has it.
			if (
				shouldWarn &&
				isInteraction &&
				messageOrInteraction.client.options.partials?.includes(Partials.Channel)
			) {
				shouldWarn = false;
			}

			// A message-based command needs both the Channel partial and the DirectMessages intent,
			// and this client already has both.
			if (
				shouldWarn &&
				!isInteraction &&
				messageOrInteraction.client.options.partials?.includes(
					Partials.Channel,
				) &&
				new IntentsBitField(messageOrInteraction.client.options.intents).has(
					GatewayIntentBits.DirectMessages,
				)
			) {
				shouldWarn = false;
			}

			if (shouldWarn) {
				console.warn(
					[
						"PaginatedMessage was started in a DM channel by a client that is missing the required partial.",
						'For this to work in DMs, add "Channel" to "client.options.partials" when constructing your client.',
						'Message based commands additionally need the "DirectMessages" intent in "client.options.intents".',
						'Silence this by setting "PaginatedMessage.emitPartialDMChannelWarning" to false, or by calling "setEmitPartialDMChannelWarning(false)" before "run".',
					].join("\n"),
				);
				this.hasEmittedPartialDMChannelWarning = true;
			}

			await safelyReplyToInteraction({
				messageOrInteraction,
				interactionEditReplyContent: this.#deadEndContent,
				interactionReplyContent: {
					...this.#deadEndContent,
					flags: MessageFlags.Ephemeral,
				},
				componentUpdateContent: this.#deadEndContent,
				messageMethod: "reply",
				messageMethodContent: this.#deadEndContent,
			});

			return this;
		}

		target ??= isAnyInteraction(messageOrInteraction)
			? messageOrInteraction.user
			: messageOrInteraction.author;

		// One handler per user: close whatever they had open before.
		const previousHandler = PaginatedMessage.handlers.get(target.id);
		previousHandler?.collector?.stop();

		// When our own client sent the trigger, edit it rather than posting something new.
		if (isAnyInteraction(messageOrInteraction)) {
			if (
				messageOrInteraction.user.bot &&
				messageOrInteraction.user.id === messageOrInteraction.client.user?.id
			) {
				this.response = messageOrInteraction;
			}
		} else if (
			messageOrInteraction.author.bot &&
			messageOrInteraction.author.id === messageOrInteraction.client.user?.id
		) {
			this.response = messageOrInteraction;
		}

		await this.resolvePagesOnRun(messageOrInteraction, target);

		if (!this.messages.length) throw new Error("There are no messages.");
		if (!this.actions.size && !this.pageActions.length)
			throw new Error("There are no actions nor page actions.");

		await this.setUpMessage(messageOrInteraction);
		this.setUpCollector(messageOrInteraction, target);

		const messageId = this.response!.id;

		if (this.collector) {
			this.collector.once("end", () => {
				PaginatedMessage.messages.delete(messageId);
				PaginatedMessage.handlers.delete(target.id);
			});

			PaginatedMessage.messages.set(messageId, this);
			PaginatedMessage.handlers.set(target.id, this);
		}

		return this;
	}

	/**
	 * Resolves every page up front, called once from {@link PaginatedMessage.run}.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param target The user the handler was opened for.
	 *
	 * @see {@link LazyPaginatedMessage} overrides this to resolve only what is needed.
	 */
	public async resolvePagesOnRun(
		messageOrInteraction: Message | AnyInteractableInteraction,
		target: User,
	): Promise<void> {
		for (let index = 0; index < this.pages.length; index++) {
			await this.resolvePage(messageOrInteraction, target, index);
		}
	}

	/**
	 * Turns one page into a finished message payload — template applied, footer written, components
	 * attached — and caches the result so it is only built once.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param target The user the handler was opened for.
	 * @param index The zero-based page index.
	 */
	public async resolvePage(
		messageOrInteraction: Message | AnyInteractableInteraction,
		target: User,
		index: number,
	): Promise<PaginatedMessageResolvedPage> {
		const cached = this.messages[index];
		if (!isNullish(cached)) {
			return cached;
		}

		const resolvedPage = await this.handlePageLoad(this.pages[index]!, index);
		if (resolvedPage.actions) {
			this.addPageActions(resolvedPage.actions, index);
		}

		const pageSpecificActions = this.pageActions.at(index);
		const resolvedComponents: PaginatedMessageComponentUnion[] = [];

		// A single-page handler needs no pagination controls.
		if (this.pages.length > 1) {
			const sharedActions = await this.handleActionLoad(
				[...this.actions.values()],
				messageOrInteraction,
				target,
			);
			resolvedComponents.push(...createPartitionedMessageRow(sharedActions));
		}

		if (pageSpecificActions) {
			const pageActions = await this.handleActionLoad(
				[...pageSpecificActions.values()],
				messageOrInteraction,
				target,
			);
			resolvedComponents.push(...createPartitionedMessageRow(pageActions));
		}

		const resolved = { ...resolvedPage, components: resolvedComponents };
		this.messages[index] = resolved;

		return resolved;
	}

	/**
	 * Produces a second handler over the same pages, actions and template, positioned on the same
	 * page.
	 */
	public clone(): PaginatedMessage {
		const clone = new (this.constructor as typeof PaginatedMessage)({
			pages: this.pages,
			actions: [],
		})
			.setIndex(this.index)
			.setIdle(this.idle);
		clone.actions = this.actions;
		clone.pageActions = this.pageActions;
		clone.response = this.response;
		clone.template = this.template;
		return clone;
	}

	/**
	 * Reads one page's raw options, running its callback if it has one. This bypasses the cache and
	 * applies neither template nor footer.
	 *
	 * @param index The zero-based page index.
	 */
	public async getPageOptions(
		index: number,
	): Promise<PaginatedMessageMessageOptionsUnion | undefined> {
		const page = this.pages.at(index);
		return isFunction(page) ? page(index, this.pages, this) : page;
	}

	/**
	 * Puts the current page on screen, choosing between editing an existing response, replying to
	 * an interaction and sending a fresh message.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 */
	protected async setUpMessage(
		messageOrInteraction: Message | AnyInteractableInteraction,
	): Promise<void> {
		let page = this.messages[this.index]!;

		page = { ...page, ...(this.paginatedMessageData ?? {}) };

		if (this.response) {
			if (isAnyInteraction(this.response)) {
				if (this.response.replied || this.response.deferred) {
					await this.response.editReply(page);
				} else {
					await this.response.reply({
						...page,
						content: page.content ?? undefined,
					});
				}
			} else if (isMessageInstance(this.response)) {
				await this.response.edit(page);
			}
		} else if (isAnyInteraction(messageOrInteraction)) {
			if (messageOrInteraction.replied || messageOrInteraction.deferred) {
				const editReplyResponse = await messageOrInteraction.editReply(page);
				// An ephemeral reply has no message we can hold on to, so keep the interaction itself.
				this.response = messageOrInteraction.ephemeral
					? messageOrInteraction
					: editReplyResponse;
			} else {
				this.response = await messageOrInteraction.reply({
					...page,
					content: page.content ?? undefined,
					fetchReply: true,
					ephemeral: false,
				});
			}
		} else if (isTextBasedChannel(messageOrInteraction.channel)) {
			this.response = await messageOrInteraction.channel.send({
				...page,
				content: page.content ?? undefined,
			});
		}
	}

	/**
	 * Starts the interaction collector, but only when there is more than one page — a single page
	 * has nothing to collect.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param targetUser The user the handler was opened for.
	 */
	protected setUpCollector(
		messageOrInteraction: Message<boolean> | AnyInteractableInteraction,
		targetUser: User,
	): void {
		if (this.pages.length > 1) {
			this.collector =
				new InteractionCollector<PaginatedMessageInteractionUnion>(
					targetUser.client,
					{
						filter: (interaction) => {
							if (
								!isNullish(this.response) &&
								interaction.isMessageComponent()
							) {
								const isOwnComponent =
									this.actions.has(interaction.customId) ||
									this.pageActions.some((actions) =>
										actions?.has(interaction.customId),
									);

								// An ephemeral response is only visible to its target, so anybody else
								// reaching it is a stale client and gets filtered out entirely.
								if (
									isAnyInteraction(messageOrInteraction) &&
									messageOrInteraction.ephemeral
								) {
									return (
										interaction.user.id === targetUser.id && isOwnComponent
									);
								}

								return isOwnComponent;
							}

							return false;
						},

						time: this.idle,

						guild: isGuildBasedChannel(messageOrInteraction.channel)
							? messageOrInteraction.channel.guild
							: undefined,

						channel: messageOrInteraction.channel as Message["channel"],

						interactionType: InteractionType.MessageComponent,

						...(!isNullish(this.response) && !isAnyInteraction(this.response)
							? {
									message: this.response,
								}
							: {}),
					},
				)
					.on(
						"collect",
						this.handleCollect.bind(
							this,
							targetUser,
							messageOrInteraction.channel as Message["channel"],
						),
					)
					.on("end", this.handleEnd.bind(this));
		}
	}

	/**
	 * Resolves one page's raw options and layers the template and footer on top.
	 *
	 * @param page The page to load.
	 * @param index The zero-based page index.
	 */
	protected async handlePageLoad(
		page: PaginatedMessagePage,
		index: number,
	): Promise<PaginatedMessageMessageOptionsUnion> {
		const options = isFunction(page)
			? await page(index, this.pages, this)
			: page;

		// Clone first so the template survives being merged into page after page.
		const clonedTemplate = deepClone(this.template);

		const optionsWithTemplate = this.applyTemplate(clonedTemplate, options);

		return this.applyFooter(optionsWithTemplate, index);
	}

	/**
	 * Turns action descriptions into the discord.js builders that can actually be serialised.
	 *
	 * The built-in "go to page" menu is special-cased: its options are generated from the current
	 * page list on the way through.
	 *
	 * @param actions The actions to build.
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param targetUser The user the handler was opened for.
	 *
	 * @throws If an action describes a component type this handler cannot build.
	 */
	protected async handleActionLoad(
		actions: PaginatedMessageAction[],
		messageOrInteraction: Message | AnyInteractableInteraction,
		targetUser: User,
	): Promise<MessageActionRowComponentBuilder[]> {
		return Promise.all(
			actions.map<Promise<MessageActionRowComponentBuilder>>(async (action) => {
				if (isMessageButtonInteractionData(action)) {
					return new ButtonBuilder(action);
				}

				if (isMessageUserSelectInteractionData(action)) {
					return new UserSelectMenuBuilder(action);
				}

				if (isMessageRoleSelectInteractionData(action)) {
					return new RoleSelectMenuBuilder(action);
				}

				if (isMessageMentionableSelectInteractionData(action)) {
					return new MentionableSelectMenuBuilder(action);
				}

				if (isMessageChannelSelectInteractionData(action)) {
					return new ChannelSelectMenuBuilder(action);
				}

				if (isMessageStringSelectInteractionData(action)) {
					return new StringSelectMenuBuilder({
						...action,
						...(action.customId === goToPageCustomId && {
							options: await Promise.all(
								this.pages.map(async (_, index) => ({
									...(await this.selectMenuOptions(
										index + 1,
										this.resolvePaginatedMessageInternationalizationContext(
											messageOrInteraction,
											targetUser,
										),
									)),
									value: index.toString(),
								})),
							),
							placeholder: this.selectMenuPlaceholder,
						}),
					});
				}

				throw new Error(
					"Unsupported message component type detected. Check your actions, and report this if you believe it is a bug.",
				);
			}),
		);
	}

	/**
	 * Runs the action behind an interaction and redraws the resulting page.
	 *
	 * Interactions from anybody other than the target get the "these aren't your buttons" reply
	 * instead.
	 *
	 * @param targetUser The user the handler was opened for.
	 * @param channel The channel the handler is running in.
	 * @param interaction The interaction that came in.
	 *
	 * @throws If no action matches the interaction's `customId`.
	 */
	protected async handleCollect(
		targetUser: User,
		channel: Message["channel"],
		interaction: PaginatedMessageInteractionUnion,
	): Promise<void> {
		if (interaction.user.id === targetUser.id) {
			// Later edits must target the newest interaction, since its token is the freshest.
			this.response = interaction;

			const action = this.getAction(interaction.customId, this.index);
			if (isNullish(action)) {
				throw new Error("There was no action for the provided custom ID");
			}

			if (actionIsButtonOrMenu(action) && action.run) {
				const previousIndex = this.index;

				await action.run({
					interaction,
					handler: this,
					author: targetUser,
					channel,
					response: this.response,
					collector: this.collector!,
				});

				// A stop action closes the handler; redrawing afterwards would race with that.
				if (!this.stopPaginatedMessageCustomIds.includes(action.customId)) {
					const newIndex =
						previousIndex === this.index ? previousIndex : this.index;
					const updateOptions = await this.resolvePage(
						this.response,
						targetUser,
						newIndex,
					);

					await safelyReplyToInteraction({
						messageOrInteraction: interaction,
						interactionEditReplyContent: updateOptions,
						interactionReplyContent: {
							...this.#deadEndContent,
							flags: MessageFlags.Ephemeral,
						},
						componentUpdateContent: updateOptions,
					});
				}
			}
		} else {
			const interactionReplyOptions = await this.wrongUserInteractionReply(
				targetUser,
				interaction.user,
				this.resolvePaginatedMessageInternationalizationContext(
					interaction,
					targetUser,
				),
			);

			await interaction.reply(
				isObject(interactionReplyOptions)
					? interactionReplyOptions
					: {
							content: interactionReplyOptions,
							flags: MessageFlags.Ephemeral,
							allowedMentions: { users: [], roles: [] },
						},
			);
		}
	}

	/**
	 * Tidies up once the collector stops: detaches the listeners and strips the components so the
	 * message is left inert rather than full of dead buttons.
	 *
	 * @param reason Why the collector ended.
	 */
	protected async handleEnd(
		_: Collection<Snowflake, PaginatedMessageInteractionUnion>,
		reason: PaginatedMessageStopReasons,
	): Promise<void> {
		// Refresh the cached message first: a click landing at the same moment the handler expires
		// would otherwise be edited against a stale reference and fail.
		if (
			(reason === "time" || reason === "idle") &&
			this.response !== null &&
			isAnyInteraction(this.response) &&
			this.response.isMessageComponent()
		) {
			this.response.message = await this.response.fetchReply();
		}

		this.collector?.removeAllListeners();

		// Nothing to strip when the message, channel or guild is already gone.
		if (
			this.response &&
			!PaginatedMessage.deletionStopReasons.includes(reason)
		) {
			void safelyReplyToInteraction({
				messageOrInteraction: this.response,
				interactionEditReplyContent: { components: [] },
				interactionReplyContent: {
					...this.#deadEndContent,
					flags: MessageFlags.Ephemeral,
				},
				componentUpdateContent: { components: [] },
				messageMethod: "edit",
				messageMethodContent: { components: [] },
			});
		}
	}

	/**
	 * Writes the page counter into the footer of a page's last embed, keeping whatever footer text
	 * was already there behind the separator.
	 *
	 * @param message The page options.
	 * @param index The zero-based page index.
	 * @returns The page options with the footer applied.
	 */
	protected applyFooter(
		message: PaginatedMessageMessageOptionsUnion,
		index: number,
	): PaginatedMessageMessageOptionsUnion {
		if (!message.embeds?.length) {
			return message;
		}

		const embeds = deepClone(
			message.embeds,
		) as PaginatedMessageWriteableEmbedResolvable;

		const lastIndex = embeds.length - 1;
		if (embeds.length > 0) {
			let lastEmbed = embeds[lastIndex]!;
			const templateEmbed =
				this.template.embeds?.[lastIndex] ?? this.template.embeds?.[0];
			const jsonTemplateEmbed = isJSONEncodable(templateEmbed)
				? templateEmbed.toJSON()
				: templateEmbed;

			if (isJSONEncodable(lastEmbed)) {
				lastEmbed = lastEmbed.toJSON();
				embeds[lastIndex] = lastEmbed;
			}

			lastEmbed.footer ??= { text: jsonTemplateEmbed?.footer?.text ?? "" };

			if (this.shouldAddFooterToEmbeds) {
				lastEmbed.footer.text = `${this.pageIndexPrefix ? `${this.pageIndexPrefix} ` : ""}${index + 1} / ${this.pages.length}${
					lastEmbed.footer.text
						? ` ${this.embedFooterSeparator} ${lastEmbed.footer.text}`
						: ""
				}`;
			}
		}

		return { ...message, embeds };
	}

	/**
	 * Gathers the guild, channel, user and Discord-reported locales into the context handed to the
	 * two localisable generators.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param targetUser The user the handler was opened for.
	 */
	protected resolvePaginatedMessageInternationalizationContext(
		messageOrInteraction: Message | AnyInteractableInteraction,
		targetUser: User,
	): PaginatedMessageInternationalizationContext {
		return {
			user: targetUser,
			channel: messageOrInteraction.channel,
			guild: isGuildBasedChannel(messageOrInteraction.channel)
				? messageOrInteraction.channel.guild
				: null,
			interactionGuildLocale: isAnyInteraction(messageOrInteraction)
				? messageOrInteraction.guildLocale
				: undefined,
			interactionLocale: isAnyInteraction(messageOrInteraction)
				? messageOrInteraction.locale
				: undefined,
		};
	}

	/**
	 * Merges a page over the template, with the page's own values winning.
	 */
	private applyTemplate(
		template: PaginatedMessageMessageOptionsUnion,
		options: PaginatedMessageMessageOptionsUnion,
	): PaginatedMessageMessageOptionsUnion {
		const embeds = this.applyTemplateEmbed(template.embeds, options.embeds);

		return { ...template, ...options, embeds };
	}

	/**
	 * Decides what a page's embeds look like once the template embed is taken into account: with no
	 * page embeds the template's first embed stands alone, with no template embed the page's are
	 * used untouched, and otherwise the template is merged underneath each of them.
	 */
	private applyTemplateEmbed(
		templateEmbed: PaginatedMessageEmbedResolvable,
		pageEmbeds: PaginatedMessageEmbedResolvable,
	): PaginatedMessageEmbedResolvable {
		if (isNullish(pageEmbeds)) {
			return templateEmbed ? [templateEmbed[0]!] : undefined;
		}

		if (isNullish(templateEmbed)) {
			return pageEmbeds;
		}

		return this.mergeEmbeds(templateEmbed[0]!, pageEmbeds);
	}

	/**
	 * Lays the template embed underneath each page embed field by field, with the page winning
	 * everywhere except `fields`, which are concatenated so both sets survive.
	 */
	private mergeEmbeds(
		templateEmbed: Exclude<PaginatedMessageEmbedResolvable, undefined>[0],
		pageEmbeds: Exclude<PaginatedMessageEmbedResolvable, undefined>,
	): Exclude<PaginatedMessageEmbedResolvable, undefined> {
		const mergedEmbeds: PaginatedMessageWriteableEmbedResolvable = [];

		const jsonTemplate = isJSONEncodable(templateEmbed)
			? templateEmbed.toJSON()
			: templateEmbed;

		for (const pageEmbed of pageEmbeds) {
			const pageJson = isJSONEncodable(pageEmbed)
				? pageEmbed.toJSON()
				: pageEmbed;

			mergedEmbeds.push({
				title: pageJson.title ?? jsonTemplate.title ?? undefined,
				description:
					pageJson.description ?? jsonTemplate.description ?? undefined,
				url: pageJson.url ?? jsonTemplate.url ?? undefined,
				timestamp:
					(typeof pageJson.timestamp === "string"
						? new Date(pageJson.timestamp).toISOString()
						: pageJson.timestamp) ??
					(typeof jsonTemplate.timestamp === "string"
						? new Date(jsonTemplate.timestamp).toISOString()
						: jsonTemplate.timestamp) ??
					undefined,
				color: pageJson.color ?? jsonTemplate.color ?? undefined,
				fields: this.mergeArrays(jsonTemplate.fields, pageJson.fields),
				author: pageJson.author ?? jsonTemplate.author ?? undefined,
				thumbnail: pageJson.thumbnail ?? jsonTemplate.thumbnail ?? undefined,
				image: pageJson.image ?? jsonTemplate.image ?? undefined,
				video: pageJson.video ?? jsonTemplate.video ?? undefined,
				footer: pageJson.footer ?? jsonTemplate.footer ?? undefined,
			});
		}

		return mergedEmbeds;
	}

	/**
	 * Concatenates two optional arrays, returning whichever one exists when the other does not.
	 */
	private mergeArrays<T>(template?: T[], array?: T[]): undefined | T[] {
		if (isNullish(array)) {
			return template;
		}

		if (isNullish(template)) {
			return array;
		}

		return [...template, ...array];
	}

	/**
	 * Looks a `customId` up among the shared actions first, then among the current page's own.
	 */
	private getAction(
		customId: string,
		index: number,
	): PaginatedMessageAction | undefined {
		const action = this.actions.get(customId);
		if (action) return action;
		return this.pageActions.at(index)?.get(customId);
	}
}
