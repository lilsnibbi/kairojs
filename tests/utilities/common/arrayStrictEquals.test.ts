import { describe, expect, test } from "bun:test";
import { arrayStrictEquals } from "@utilities/common/index.ts";

describe("arrayStrictEquals", () => {
	test("GIVEN same array THEN returns true", () => {
		const array: unknown[] = [];
		expect(arrayStrictEquals(array, array)).toBe(true);
	});

	test("GIVEN cloned array THEN returns true", () => {
		const array: unknown[] = [];
		const clone = array.slice();
		expect(arrayStrictEquals(array, clone)).toBe(true);
	});

	test("GIVEN arrays of same length THEN returns true", () => {
		const array: number[] = [1];
		const other: number[] = [1];

		expect(arrayStrictEquals(array, other)).toBe(true);
	});

	test("GIVEN arrays of different length THEN returns false", () => {
		const array: number[] = [1];
		const other: number[] = [1, 2];

		expect(arrayStrictEquals(array, other)).toBe(false);
	});

	test("GIVEN different arrays THEN returns false", () => {
		const array: number[] = [1];
		const other: number[] = [2];

		expect(arrayStrictEquals(array, other)).toBe(false);
	});

	test("GIVEN array with different types THEN returns false", () => {
		const array: number[] = [1, 2, 3];
		const other: (number | string)[] = [1, 2, "3"];

		expect(arrayStrictEquals(array, other)).toBe(false);
	});

	test("GIVEN array with order THEN returns false", () => {
		const array: number[] = [3, 1, 2];
		const other: number[] = [1, 2, 3];

		expect(arrayStrictEquals(array, other)).toBe(false);
	});
});
