import type {
	AnyInteractableInteraction,
	EmbedResolvable,
	PaginatedMessageResolvedPage,
} from "@types";
import { isFunction } from "@utilities/common/index.ts";
import { EmbedBuilder, type Message, type User } from "discord.js";
import { MessageBuilder } from "../builders/messageBuilder.ts";
import { PaginatedMessage } from "./paginatedMessage.ts";

/**
 * A {@link PaginatedMessage} that builds pages only when they are about to be needed, instead of
 * building all of them the moment it runs.
 *
 * Every `addPage*` method is overridden to wrap its argument in a callback, so nothing is
 * evaluated up front. Resolving a page also warms the pages on either side of it, which means the
 * reader never waits on the next click.
 *
 * Reach for this whenever building a page is expensive — a database query or an HTTP call per page
 * — since a reader who stops after page two will never pay for the other twenty-three.
 *
 * @since 1.0.0
 */
export class LazyPaginatedMessage extends PaginatedMessage {
	/**
	 * Resolves only the page the handler is about to show.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param target The user the handler was opened for.
	 */
	public override async resolvePagesOnRun(
		messageOrInteraction: Message | AnyInteractableInteraction,
		target: User,
	): Promise<void> {
		await this.resolvePage(messageOrInteraction, target, this.index);
	}

	/**
	 * Resolves the requested page along with its immediate neighbours, so stepping either way is
	 * instant.
	 *
	 * @param messageOrInteraction Whatever triggered the handler.
	 * @param target The user the handler was opened for.
	 * @param index The zero-based page index.
	 */
	public override async resolvePage(
		messageOrInteraction: Message | AnyInteractableInteraction,
		target: User,
		index: number,
	): Promise<PaginatedMessageResolvedPage> {
		const pending = [super.resolvePage(messageOrInteraction, target, index)];
		if (this.hasPage(index - 1))
			pending.push(super.resolvePage(messageOrInteraction, target, index - 1));
		if (this.hasPage(index + 1))
			pending.push(super.resolvePage(messageOrInteraction, target, index + 1));

		const [requested] = await Promise.all(pending);
		return requested!;
	}

	/**
	 * Appends a page built with a {@link MessageBuilder}, deferring the build until the page is
	 * first shown.
	 *
	 * @param builder Either a ready-made builder, or a callback handed a fresh one.
	 */
	public override addPageBuilder(
		builder: MessageBuilder | ((builder: MessageBuilder) => MessageBuilder),
	): this {
		return this.addPage(() =>
			isFunction(builder) ? builder(new MessageBuilder()) : builder,
		);
	}

	/**
	 * Appends a page that is nothing but text, deferring the build until the page is first shown.
	 *
	 * @param content The message content.
	 */
	public override addPageContent(content: string): this {
		return this.addPage(() => ({ content }));
	}

	/**
	 * Appends a page carrying a single embed, deferring the build until the page is first shown.
	 *
	 * @param embed Either a ready-made embed, or a callback handed a fresh {@link EmbedBuilder}.
	 */
	public override addPageEmbed(
		embed: EmbedResolvable | ((builder: EmbedBuilder) => EmbedResolvable),
	): this {
		return this.addPage(() => ({
			embeds:
				typeof embed === "function" ? [embed(new EmbedBuilder())] : [embed],
		}));
	}

	/**
	 * Appends a page carrying several embeds, deferring the build until the page is first shown.
	 *
	 * @param embeds Either an array of ready-made embeds, or a callback handed ten fresh
	 * {@link EmbedBuilder} instances. More than ten is truncated to the first ten.
	 */
	public override addPageEmbeds(
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
		return this.addPage(() => {
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

			return { embeds: resolvedEmbeds };
		});
	}
}
