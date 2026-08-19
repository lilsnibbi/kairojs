import { describe, expect, test } from "bun:test";
import { objectToTuples } from "@utilities/utilities/index.ts";

describe("objectToTuples", () => {
	test("GIVEN basic THEN returns expected", () => {
		const source = { a: "Hello", b: 420 };
		const expected = [
			["a", "Hello"],
			["b", 420],
		] as [string, unknown][];

		expect(objectToTuples(source) as unknown).toEqual(expected);
	});

	test("GIVEN deep THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } };
		const expected = [
			["a", "Hello"],
			["b", 420],
			["deep.i", []],
		] as [string, unknown][];

		expect(objectToTuples(source) as unknown).toEqual(expected);
	});
});
