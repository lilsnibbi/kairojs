import { describe, expect, test } from "bun:test";
import { noop } from "@utilities/utilities/index.ts";

describe("noop", () => {
	test("GIVEN noop THEN has undefined return type", () => {
		expect(noop()).toBeUndefined();
	});
});
