import { describe, expect, test } from "bun:test";
import { EmptyStrategy } from "@utilities/lexure/index.ts";
import { Option } from "@utilities/result/index.ts";
import type { UnorderedStrategy } from "@types";

describe("EmptyStrategy", () => {
	const strategy: UnorderedStrategy = new EmptyStrategy();

	describe("matchFlag", () => {
		test("GIVEN any value THEN returns none", () => {
			expect(strategy.matchFlag("foo")).toEqual(Option.none);
		});
	});

	describe("matchOption", () => {
		test("GIVEN any value THEN returns none", () => {
			expect(strategy.matchOption("foo")).toEqual(Option.none);
		});
	});
});
