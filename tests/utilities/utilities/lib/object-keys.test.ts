import { describe, expect, expectTypeOf, test } from "bun:test";
import { objectKeys } from "@utilities/utilities/index.ts";

describe("objectKeys", () => {
	test("GIVEN basic readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420 } as const;
		const expected = ["a", "b"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<("a" | "b")[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep readonly THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } } as const;
		const expected = ["a", "b", "deep"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<("a" | "b" | "deep")[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array readonly THEN returns expected", () => {
		const source = ["Hello", 420] as const;
		const expected = ["0", "1"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<`${number}`[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN basic THEN returns expected", () => {
		const source = { a: "Hello", b: 420 };
		const expected = ["a", "b"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<("a" | "b")[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN deep THEN returns expected", () => {
		const source = { a: "Hello", b: 420, deep: { i: [] } };
		const expected = ["a", "b", "deep"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<("a" | "b" | "deep")[]>();
		expect(actual as unknown).toEqual(expected);
	});

	test("GIVEN array THEN returns expected", () => {
		const source = ["Hello", 420];
		const expected = ["0", "1"];

		const actual = objectKeys(source);

		expectTypeOf(actual).toExtend<`${number}`[]>();
		expect(actual as unknown).toEqual(expected);
	});
});
