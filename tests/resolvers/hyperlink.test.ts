import { describe, expect, test } from "bun:test";
import { Identifiers } from "@/constants/identifiers.ts";
import { resolveHyperlink } from "@/resolvers/hyperlink.ts";
import { Result } from "@utilities/result/index.ts";

const STRING_URL = "https://github.com/kairojs";
const PARSED_URL = new URL(STRING_URL);

describe("Hyperlink resolver", () => {
	test("GIVEN a valid hyperlink THEN returns its parsed value", () => {
		expect(resolveHyperlink(STRING_URL)).toEqual(Result.ok(PARSED_URL));
	});

	test("GIVEN an invalid hyperlink THEN returns error", () => {
		expect(resolveHyperlink("hello")).toEqual(
			Result.err(Identifiers.ArgumentHyperlinkError),
		);
	});
});
