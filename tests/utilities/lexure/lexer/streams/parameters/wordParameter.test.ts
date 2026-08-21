import { describe, expect, test } from "bun:test";
import { WordParameter } from "@utilities/lexure/index.ts";

describe("WordParameter", () => {
	const parameter = new WordParameter([" ", " "], { value: "foo" });

	test("GIVEN instance THEN all properties are well defined", () => {
		expect(parameter.value).toBe("foo");
		expect(parameter.raw).toBe("foo");
		expect(parameter.leading).toBe("  ");
	});
});
