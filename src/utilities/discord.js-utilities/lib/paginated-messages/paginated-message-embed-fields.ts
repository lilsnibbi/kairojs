import type { EmbedResolvable } from "@types";
import { EmbedLimits } from "@utilities/discord-utilities/index.ts";
import { isFunction, isNullishOrEmpty } from "@utilities/utilities/index.ts";
import {
	EmbedBuilder,
	isJSONEncodable,
	type APIEmbed,
	type EmbedData,
	type EmbedField,
} from "discord.js";
import { PaginatedMessage } from "./paginated-message.ts";

/**
 * A {@link PaginatedMessage} that paginates whole embed fields, spreading a long list of them
 * across as many pages as it takes.
 *
 * The distinction from {@link PaginatedFieldMessageEmbed} is what an "item" is: here an item is
 * already a complete embed field, whereas there an item is any shape you like and a formatter
 * turns it into one line inside a single field.
 *
 * Call {@link PaginatedMessageEmbedFields.make} to build the pages, then `run` to display them —
 * in that order, and last.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { PaginatedMessageEmbedFields } from "kairojs/utilities/discord.js-utilities";
 *
 * await new PaginatedMessageEmbedFields()
 *   .setTemplate({ title: "Who does what", color: 0x006080 })
 *   .setItems([
 *     { name: "Alice", value: "Backend", inline: false },
 *     { name: "Bob", value: "Frontend", inline: false },
 *     { name: "Carol", value: "Infrastructure", inline: false }
 *   ])
 *   .setItemsPerPage(2)
 *   .make()
 *   .run(message);
 * ```
 */
export class PaginatedMessageEmbedFields extends PaginatedMessage {
	/**
	 * The embed every page is cloned from.
	 */
	private embedTemplate: APIEmbed = new EmbedBuilder().toJSON();

	/**
	 * How many pages {@link PaginatedMessageEmbedFields.make} worked out it needs.
	 */
	private totalPages: number = 0;

	/**
	 * The fields being paginated.
	 */
	private items: EmbedField[] = [];

	/**
	 * How many fields each page shows.
	 */
	private itemsPerPage: number = 10;

	/**
	 * Sets the fields to paginate.
	 *
	 * @param items The fields.
	 */
	public setItems(items: EmbedField[]): this {
		this.items = items;
		return this;
	}

	/**
	 * Sets how many fields each page shows.
	 *
	 * @param itemsPerPage The field count. Fields already present on the template count towards it.
	 */
	public setItemsPerPage(itemsPerPage: number): this {
		this.itemsPerPage = itemsPerPage;
		return this;
	}

	/**
	 * Sets the embed every page is cloned from.
	 *
	 * @param template An embed builder, a raw embed object, or a callback handed a fresh
	 * {@link EmbedBuilder}.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessageEmbedFields } from "kairojs/utilities/discord.js-utilities";
	 * import { EmbedBuilder } from "discord.js";
	 *
	 * new PaginatedMessageEmbedFields()
	 *   .setTemplate(new EmbedBuilder().setColor("#006080").setTitle("Who does what"))
	 *   .setItems([{ name: "Alice", value: "Backend", inline: false }])
	 *   .make()
	 *   .run(message);
	 * ```
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedMessageEmbedFields } from "kairojs/utilities/discord.js-utilities";
	 *
	 * new PaginatedMessageEmbedFields()
	 *   .setTemplate({ title: "Who does what", color: 0x006080 })
	 *   .setItems([{ name: "Alice", value: "Backend", inline: false }])
	 *   .make()
	 *   .run(message);
	 * ```
	 */
	public setTemplate(
		template: EmbedResolvable | ((embed: EmbedBuilder) => EmbedResolvable),
	): this {
		this.embedTemplate = this.resolveTemplate(template);
		return this;
	}

	/**
	 * Slices the fields into pages and adds them to the handler. Call this before `run`.
	 *
	 * @throws If there are no items, or if a page would carry more fields than Discord allows on a
	 * single embed.
	 */
	public make(): this {
		if (!this.items.length) throw new Error("The items array is empty.");
		if (this.itemsPerPage > EmbedLimits.MaximumFields)
			throw new Error(
				`Pages cannot contain more than ${EmbedLimits.MaximumFields} fields.`,
			);

		this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
		this.generatePages();
		return this;
	}

	/**
	 * Builds one page per slice, each a clone of the template. The template's own fields are moved
	 * behind this page's, and a template with no colour gets a random one so the pages are not
	 * plain grey.
	 */
	private generatePages(): void {
		const template = this.embedTemplate;
		for (let page = 0; page < this.totalPages; page++) {
			const clonedTemplate = new EmbedBuilder(template);
			const templateFields = isNullishOrEmpty(template.fields)
				? []
				: [...template.fields];
			if (templateFields.length > 0) clonedTemplate.setFields();

			if (!clonedTemplate.data.color) clonedTemplate.setColor("Random");

			// The template's own fields eat into this page's budget.
			const slice = this.paginateArray(
				this.items,
				page,
				this.itemsPerPage - templateFields.length,
			);
			this.addPage({
				embeds: [clonedTemplate.addFields(...slice, ...templateFields)],
			});
		}
	}

	/**
	 * Takes the slice of fields belonging to one page.
	 */
	private paginateArray(
		items: EmbedField[],
		currentPage: number,
		perPageItems: number,
	): EmbedField[] {
		const offset = currentPage * perPageItems;
		return items.slice(offset, offset + perPageItems);
	}

	/**
	 * Normalises whichever of the three template forms was given into a raw embed object.
	 */
	private resolveTemplate(
		template:
			| EmbedResolvable
			| EmbedData
			| ((embed: EmbedBuilder) => EmbedResolvable),
	): APIEmbed {
		if (isFunction(template)) template = template(new EmbedBuilder());
		return (
			isJSONEncodable(template) ? template : new EmbedBuilder(template)
		).toJSON();
	}
}
