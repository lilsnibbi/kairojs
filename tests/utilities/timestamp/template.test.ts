import { describe, expect, test } from "bun:test";
import { Timestamp } from "@utilities/timestamp/index.ts";
import type { TimestampTemplateEntry } from "@types";

/**
 * The rewrite keeps the parsed template in a `#private` field, which no test can reach. The pattern
 * parser itself is a `private static` member, so it is still reachable at runtime — parsing the
 * instance's own {@link Timestamp.pattern} reproduces exactly the template the instance built for
 * itself, which is what the original test asserted.
 */
function extractParsedTemplate(timestamp: Timestamp): TimestampTemplateEntry[] {
	const internals = Timestamp as unknown as {
		parse(pattern: string): TimestampTemplateEntry[];
	};
	return internals.parse(timestamp.pattern);
}

describe("template", () => {
	test("GIVEN empty template THEN returns empty array", () => {
		const timestamp = new Timestamp("");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([]);
	});

	test("GIVEN 'hh:mm:ss' THEN returns array with 2 literals and 3 variables", () => {
		const timestamp = new Timestamp("hh:mm:ss");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: null,
				type: "hh",
			},
			{
				content: ":",
				type: "literal",
			},
			{
				content: null,
				type: "mm",
			},
			{
				content: ":",
				type: "literal",
			},
			{
				content: null,
				type: "ss",
			},
		]);
	});

	test("GIVEN 'hh[ hours, ]mm[ minutes]' THEN returns array with 2 literals and 2 variables", () => {
		const timestamp = new Timestamp("hh[ hours, ]mm[ minutes]");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: null,
				type: "hh",
			},
			{
				content: " hours, ",
				type: "literal",
			},
			{
				content: null,
				type: "mm",
			},
			{
				content: " minutes",
				type: "literal",
			},
		]);
	});

	test("GIVEN 'llllll' THEN returns array with 2 variables", () => {
		const timestamp = new Timestamp("llllll");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: null,
				type: "llll",
			},
			{
				content: null,
				type: "ll",
			},
		]);
	});

	test("GIVEN 'llllll' and updating to 'llll' THEN returns updated templates", () => {
		const date = new Date(2019, 2, 9, 16, 20, 35, 1);
		const timestamp = new Timestamp("llllll");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: null,
				type: "llll",
			},
			{
				content: null,
				type: "ll",
			},
		]);

		expect(timestamp.edit("llll")).toBe(timestamp);

		const editedParsedTemplate = extractParsedTemplate(timestamp);
		expect(editedParsedTemplate).toStrictEqual([
			{
				content: null,
				type: "llll",
			},
		]);

		// The instance's own (unreachable) template must have been re-parsed alongside the pattern:
		expect(timestamp.display(date)).toBe(
			Timestamp.displayArbitrary("llll", date),
		);
	});

	// The original test used "kaira" as written in Japanese, because those characters are
	// guaranteed not to become pattern tokens in the foreseeable future.
	test("GIVEN 'カイラ' THEN returns array with 1 literal", () => {
		const timestamp = new Timestamp("カイラ");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: "カイラ",
				type: "literal",
			},
		]);
	});

	test("GIVEN '][' THEN returns array with 2 literals", () => {
		const timestamp = new Timestamp("][");
		const parsedTemplate = extractParsedTemplate(timestamp);
		expect(parsedTemplate).toStrictEqual([
			{
				content: "]",
				type: "literal",
			},
			{
				content: "[",
				type: "literal",
			},
		]);
	});
});
