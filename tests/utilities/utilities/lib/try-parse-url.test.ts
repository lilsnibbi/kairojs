import { describe, expect, test } from "bun:test";
import { tryParseURL } from "@utilities/utilities/index.ts";

describe("tryParseURL", () => {
	test("GIVEN valid URL THEN returns URL", () => {
		expect(tryParseURL("https://kairojs.dev")).toStrictEqual(
			new URL("https://kairojs.dev"),
		);
	});

	test("GIVEN invalid url THEN returns null", () => {
		expect(tryParseURL("thisisnotaurl")).toBeNull();
	});
});
