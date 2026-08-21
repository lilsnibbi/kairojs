import { describe, expect, test } from "bun:test";
import { range } from "@utilities/common/index.ts";

describe("range", () => {
	test("GIVEN positive min,max,step THEN returns range array", () => {
		expect(range(1, 3, 1)).toEqual([1, 2, 3]);
	});

	test("GIVEN positive min,max negative step THEN returns empty array", () => {
		expect(range(1, 3, -2)).toEqual([]);
	});

	test("GIVEN negative min positive max,step THEN returns range array", () => {
		expect(range(-1, 3, 2)).toEqual([-1, 1, 3]);
	});

	test("GIVEN negative min,max,step THEN returns negative range array", () => {
		expect(range(-1, -3, -1)).toEqual([-1, -2, -3]);
	});

	test("GIVEN negative min,max positive step THEN throws error", () => {
		// The rejection comes from `new Array(-1)`, so the message is engine-specific: V8 says
		// "Invalid array length" while JavaScriptCore (Bun) words it differently. Only the error
		// type is portable.
		expect(() => range(-1, -3, 1)).toThrowError(RangeError);
	});

	test("GIVEN negative min (lower than max),max positive step THEN gives negative range", () => {
		expect(range(-3, -1, 1)).toEqual([-3, -2, -1]);
	});
});
