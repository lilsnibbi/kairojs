import { describe, expect, mock, test } from "bun:test";
import {
	ascString,
	defaultCompare,
	descString,
	isSortedBy,
} from "@utilities/iterator/index.ts";

describe("isSortedBy", () => {
	test("GIVEN iterable with values in ascending order with a asc function THEN returns true", () => {
		const comparator = mock(ascString);
		const iterable = [1, 2, 2, 9];

		const result = isSortedBy(iterable, comparator);
		expect(result).toBe(true);
		expect(comparator).toHaveBeenCalledTimes(3);

		// asc(1, 2) = -1
		expect(comparator).toHaveBeenNthCalledWith(1, 1, 2);
		expect(comparator).toHaveNthReturnedWith(1, -1);

		// asc(2, 2) = 0
		expect(comparator).toHaveBeenNthCalledWith(2, 2, 2);
		expect(comparator).toHaveNthReturnedWith(2, 0);

		// asc(2, 9) = -1
		expect(comparator).toHaveBeenNthCalledWith(3, 2, 9);
		expect(comparator).toHaveNthReturnedWith(3, -1);
	});

	test("GIVEN iterable with values in descending order with a desc function THEN returns true", () => {
		const comparator = mock(descString);
		const iterable = [9, 2, 2, 1];

		const result = isSortedBy(iterable, comparator);
		expect(result).toBe(true);
		expect(comparator).toHaveBeenCalledTimes(3);

		// desc(9, 2) = 1
		expect(comparator).toHaveBeenNthCalledWith(1, 9, 2);
		expect(comparator).toHaveNthReturnedWith(1, -1);

		// desc(2, 2) = 0
		expect(comparator).toHaveBeenNthCalledWith(2, 2, 2);
		expect(comparator).toHaveNthReturnedWith(2, 0);

		// desc(2, 1) = 1
		expect(comparator).toHaveBeenNthCalledWith(3, 2, 1);
		expect(comparator).toHaveNthReturnedWith(3, -1);
	});

	test("GIVEN an iterable with one value THEN returns true", () => {
		const comparator = mock(defaultCompare);
		const iterable = [0];

		const result = isSortedBy(iterable, comparator);
		expect(result).toBe(true);
		expect(comparator).not.toHaveBeenCalled();
	});

	test("GIVEN an empty iterable THEN returns true", () => {
		const comparator = mock(defaultCompare);
		const iterable: number[] = [];

		const result = isSortedBy(iterable, comparator);
		expect(result).toBe(true);
		expect(comparator).not.toHaveBeenCalled();
	});
});
