import { describe, expect, test } from "bun:test";
import { reverse } from "@utilities/iterator-utilities/index.ts";

describe("reverse", () => {
	test("GIVEN iterable with elements THEN returns reversed iterable", () => {
		const iterable = [1, 2, 3];
		const result = [...reverse(iterable)];
		expect(result).toEqual([3, 2, 1]);
	});

	test("GIVEN empty iterable THEN returns empty iterable", () => {
		const iterable: number[] = [];
		const result = [...reverse(iterable)];
		expect(result).toEqual([]);
	});

	test("GIVEN iterable with single element THEN returns iterable with the same element", () => {
		const iterable = [42];
		const result = [...reverse(iterable)];
		expect(result).toEqual([42]);
	});
});
