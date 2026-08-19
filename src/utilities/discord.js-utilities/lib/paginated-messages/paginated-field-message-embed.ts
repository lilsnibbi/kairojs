import type { EmbedResolvable } from "@types";
import {
	isFunction,
	isNullish,
	isNullishOrEmpty,
} from "@utilities/utilities/index.ts";
import {
	EmbedBuilder,
	isJSONEncodable,
	type APIEmbed,
	type EmbedData,
} from "discord.js";
import { PaginatedMessage } from "./paginated-message.ts";

/**
 * A {@link PaginatedMessage} that paginates a list of your own items into one embed field, joining
 * each page's slice with newlines.
 *
 * The distinction from {@link PaginatedMessageEmbedFields} is what an "item" is: here an item is
 * whatever shape you like and a formatter turns it into a line of text, whereas there an item is
 * already a whole embed field.
 *
 * Call {@link PaginatedFieldMessageEmbed.make} to build the pages, then `run` to display them — in
 * that order, and last.
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { PaginatedFieldMessageEmbed } from "kairojs/utilities/discord.js-utilities";
 *
 * await new PaginatedFieldMessageEmbed<{ name: string; role: string }>()
 *   .setTitleField("Team")
 *   .setTemplate({ title: "Who does what" })
 *   .setItems([
 *     { name: "Alice", role: "Backend" },
 *     { name: "Bob", role: "Frontend" },
 *     { name: "Carol", role: "Infrastructure" }
 *   ])
 *   .formatItems((item) => `${item.name} — ${item.role}`)
 *   .setItemsPerPage(2)
 *   .make()
 *   .run(message);
 * ```
 */
export class PaginatedFieldMessageEmbed<T> extends PaginatedMessage {
	/**
	 * The embed every page is cloned from.
	 */
	private embedTemplate: APIEmbed = new EmbedBuilder().toJSON();

	/**
	 * How many pages {@link PaginatedFieldMessageEmbed.make} worked out it needs.
	 */
	private totalPages: number = 0;

	/**
	 * The items being paginated.
	 */
	private items: T[] = [];

	/**
	 * How many items each page shows.
	 */
	private itemsPerPage: number = 10;

	/**
	 * The name of the embed field the items are written into.
	 */
	private fieldTitle: string = "";

	/**
	 * Sets the items to paginate.
	 *
	 * @param items The items.
	 */
	public setItems(items: T[]) {
		this.items = items;
		return this;
	}

	/**
	 * Sets the name of the embed field the items are written into.
	 *
	 * @param title The field name.
	 */
	public setTitleField(title: string) {
		this.fieldTitle = title;
		return this;
	}

	/**
	 * Sets how many items each page shows.
	 *
	 * @param itemsPerPage The item count.
	 */
	public setItemsPerPage(itemsPerPage: number) {
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
	 * import { PaginatedFieldMessageEmbed } from "kairojs/utilities/discord.js-utilities";
	 * import { EmbedBuilder } from "discord.js";
	 *
	 * new PaginatedFieldMessageEmbed().setTemplate(new EmbedBuilder().setTitle("Who does what"));
	 * ```
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedFieldMessageEmbed } from "kairojs/utilities/discord.js-utilities";
	 *
	 * new PaginatedFieldMessageEmbed().setTemplate({ title: "Who does what" });
	 * ```
	 */
	public setTemplate(
		template:
			| EmbedData
			| EmbedResolvable
			| ((embed: EmbedBuilder) => EmbedResolvable),
	) {
		this.embedTemplate = this.resolveTemplate(template);
		return this;
	}

	/**
	 * Maps every item through a formatter, replacing the stored items with the result.
	 *
	 * The output is joined with newlines into a single field value, so it wants to be text or
	 * something that stringifies into text.
	 *
	 * @param formatter Called once per item, with the same arguments `Array#map` would give it.
	 *
	 * @example
	 * ```typescript
	 * import { PaginatedFieldMessageEmbed } from "kairojs/utilities/discord.js-utilities";
	 *
	 * new PaginatedFieldMessageEmbed<{ name: string; role: string }>()
	 *   .setTitleField("Team")
	 *   .setItems([{ name: "Alice", role: "Backend" }])
	 *   .formatItems((item) => `${item.name} — ${item.role}`)
	 *   .make()
	 *   .run(message);
	 * ```
	 */
	public formatItems(formatter: (item: T, index: number, array: T[]) => any) {
		this.items = this.items.map(formatter);
		return this;
	}

	/**
	 * Slices the items into pages and adds them to the handler. Call this before `run`.
	 *
	 * @throws If no field title was set, if there are no items, or if any item is falsy.
	 */
	public make() {
		if (!this.fieldTitle.length)
			throw new Error("The title of the field to format must have a value.");
		if (!this.items.length) throw new Error("The items array is empty.");
		if (this.items.some((item) => !item))
			throw new Error("The format of the array items is incorrect.");

		this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
		this.generatePages();
		return this;
	}

	/**
	 * Builds one page per slice, each a clone of the template with this slice joined into the named
	 * field. A template with no colour gets a random one so the pages are not plain grey.
	 */
	private generatePages() {
		const template = this.embedTemplate;
		for (let page = 0; page < this.totalPages; page++) {
			const clonedTemplate = new EmbedBuilder(template);
			const templateFields = isNullishOrEmpty(template.fields)
				? []
				: [...template.fields];
			// Clear the cloned fields so ours lands first and the template's follow.
			if (templateFields.length > 0) clonedTemplate.setFields();
			if (isNullish(template.color)) clonedTemplate.setColor("Random");

			const slice = this.paginateArray(this.items, page, this.itemsPerPage);
			this.addPage({
				embeds: [
					clonedTemplate.addFields(
						{ name: this.fieldTitle, value: slice.join("\n"), inline: false },
						...templateFields,
					),
				],
			});
		}
	}

	/**
	 * Takes the slice of items belonging to one page.
	 */
	private paginateArray(items: T[], currentPage: number, perPageItems: number) {
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
