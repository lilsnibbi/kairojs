import { describe, expect, expectTypeOf, test } from "bun:test";
import { objectValues } from "@utilities/utilities/index.ts";

describe("objectValues", () => {
	test("GIVEN basic readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420 } as const;
		const expected = ["Hello", 420];

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<("Hello" | 420)[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } } as const;
		const expected = ["Hello", 420, { i: [] }];

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<("Hello" | 420 | { i: readonly [] })[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array readonly THEN returns same", () => {
		const source = ["Hello", 420] as const;

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<("Hello" | 420)[]>();
		expect(actual as unknown).toEqual(source);
	});

	test("GIVEN basic THEN returns expected", () => {
		const source = { a: "Hello", b: 420 };
		const expected = ["Hello", 420];

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<(string | number)[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } };
		const expected = ["Hello", 420, { i: [] }];

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<(string | number | { i: never[] })[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array THEN returns same", () => {
		const source = ["Hello", 420];

		const actual = objectValues(source);

		expectTypeOf(actual).toExtend<(string | number)[]>();
		expect(actual as unknown).toEqual(source);
	});
});
