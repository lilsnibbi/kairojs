import { describe, expect, mock, test } from "bun:test";
import { tryParseJSON } from "@utilities/utilities/index.ts";

describe("tryParseJSON", () => {
	test("GIVEN basic THEN returns expected", () => {
		const source = '{"a":4,"b":6}';
		const expected = { a: 4, b: 6 };
		expect(tryParseJSON(source)).toEqual(expected);
	});

	test("GIVEN basic with replacer THEN returns expected", () => {
		const source = '{"a":4,"b":6}';
		const expected = { a: "4", b: "6" };
		const replacer = mock((_key: string, value: unknown) =>
			typeof value === "number" ? String(value) : value,
		);
		expect(tryParseJSON(source, replacer)).toEqual(expected);
		expect(replacer).toHaveBeenCalledTimes(3);
	});

	test("GIVEN invalid THEN returns expected", () => {
		const source = '{"a":4,"b:6}';
		const expected = '{"a":4,"b:6}';
		expect(tryParseJSON(source)).toEqual(expected);
	});
});
