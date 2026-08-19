import { describe, expect, mock, test } from "bun:test";
import type { LexicographicComparison } from "@types";
import {
	compareBy,
	defaultCompare,
} from "@utilities/iterator-utilities/index.ts";

describe("compareBy", () => {
	test("GIVEN two equal iterables THEN returns 0", () => {
		const fn = mock(defaultCompare);
		const result = compareBy([1], [1], fn);

		expect<LexicographicComparison>(result).toBe(0);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(1, 1);
		expect(fn).toHaveReturnedWith(0);
	});

	test("GIVEN [1] and [1, 2] THEN returns -1", () => {
		const fn = mock(defaultCompare);
		const result = compareBy([1], [1, 2], fn);

		expect<LexicographicComparison>(result).toBe(-1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(1, 1);
		expect(fn).toHaveReturnedWith(0);
	});

	test("GIVEN [1, 2] and [1] THEN returns -1", () => {
		const fn = mock(defaultCompare);
		const result = compareBy([1, 2], [1], fn);

		expect<LexicographicComparison>(result).toBe(1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(1, 1);
		expect(fn).toHaveReturnedWith(0);
	});

	describe("edge cases", () => {
		test("GIVEN [undefined] and [1] THEN returns 1", () => {
			const fn = mock(defaultCompare);
			const result = compareBy([undefined], [1], fn);

			expect<LexicographicComparison>(result).toBe(1);
			expect(fn).not.toHaveBeenCalled();
		});

		test("GIVEN [1] and [undefined] THEN returns -1", () => {
			const fn = mock(defaultCompare);
			const result = compareBy([1], [undefined], fn);

			expect<LexicographicComparison>(result).toBe(-1);
			expect(fn).not.toHaveBeenCalled();
		});

		test("GIVEN [undefined] and [undefined] THEN returns -1", () => {
			const fn = mock(defaultCompare);
			const result = compareBy([undefined], [undefined], fn);

			expect<LexicographicComparison>(result).toBe(0);
			expect(fn).not.toHaveBeenCalled();
		});
	});
});
