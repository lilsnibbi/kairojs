import { describe, expect, expectTypeOf, test } from "bun:test";
import { objectEntries } from "@utilities/utilities/index.ts";

describe("objectEntries", () => {
	test("GIVEN basic readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420 } as const;
		const expected = [
			["a", "Hello"],
			["b", 420],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<["a" | "b", "Hello" | 420][]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } } as const;
		const expected = [
			["a", "Hello"],
			["b", 420],
			["deep", { i: [] }],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<
			["a" | "b" | "deep", "Hello" | 420 | { i: readonly [] }][]
		>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array readonly THEN returns expected", () => {
		const source = ["Hello", 420] as const;
		const expected = [
			["0", "Hello"],
			["1", 420],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<[`${number}`, "Hello" | 420][]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN basic THEN returns expected", () => {
		const source = { a: "Hello", b: 420 };
		const expected = [
			["a", "Hello"],
			["b", 420],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<["a" | "b", string | number][]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } };
		const expected = [
			["a", "Hello"],
			["b", 420],
			["deep", { i: [] }],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<
			["a" | "b" | "deep", string | number | { i: never[] }][]
		>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array THEN returns expected", () => {
		const source = ["Hello", 420];
		const expected = [
			["0", "Hello"],
			["1", 420],
		];

		const actual = objectEntries(source);

		expectTypeOf(actual).toExtend<[`${number}`, string | number][]>();
		expect(actual as unknown).toEqual(expected);
	});
});
