import { describe, expect, test } from "bun:test";
import { hasAtLeastOneKeyInObject } from "@utilities/common/index.ts";

describe("hasAtLeastOneKeyInObject", () => {
	test("should return true if the object has at least one of the keys", () => {
		const object = { a: 1, b: 2, c: 3 };
		expect(hasAtLeastOneKeyInObject(object, ["a"])).toBe(true);
	});

	test("should return false if the object does not have any of the keys", () => {
		const object = { a: 1, b: 2, c: 3 };
		expect(hasAtLeastOneKeyInObject(object, ["d"])).toBe(false);
	});

	test("should return false if the object is nullish", () => {
		const object = null;
		// @ts-expect-error Testing invalid input
		expect(hasAtLeastOneKeyInObject(object, ["a"])).toBe(false);
	});

	test("should return true if the object has the key and its value is not nullish", () => {
		const object = { a: 1, b: null, c: undefined };
		expect(hasAtLeastOneKeyInObject(object, ["a"])).toBe(true);
	});

	test("should return true if the object has at least one key from the array", () => {
		const object = { a: 1, b: 2, c: 3 };
		expect(hasAtLeastOneKeyInObject(object, ["b", "c", "d"])).toBe(true);
	});

	test("should return false if the object does not have any key from the array", () => {
		const object = { a: 1, b: 2, c: 3 };
		expect(hasAtLeastOneKeyInObject(object, ["d", "e", "f"])).toBe(false);
	});

	test("should return true if the object has at least one key and its value is not nullish", () => {
		const object = { a: 1, b: null, c: undefined };
		expect(hasAtLeastOneKeyInObject(object, ["a", "b"])).toBe(true);
	});
});
