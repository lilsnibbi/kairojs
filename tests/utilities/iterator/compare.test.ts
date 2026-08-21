import { describe, expect, test } from "bun:test";
import type { LexicographicComparison } from "@types";
import { compare } from "@utilities/iterator/index.ts";

describe("compare", () => {
	test("GIVEN two equal iterables THEN returns 0", () => {
		const result = compare([1], [1]);
		expect<LexicographicComparison>(result).toBe(0);
	});

	test("GIVEN [1] and [1, 2] THEN returns -1", () => {
		const result = compare([1], [1, 2]);
		expect<LexicographicComparison>(result).toBe(-1);
	});

	test("GIVEN [1, 2] and [1] THEN returns -1", () => {
		const result = compare([1, 2], [1]);
		expect<LexicographicComparison>(result).toBe(1);
	});

	test("GIVEN [0, 1] and [1] THEN returns -1", () => {
		const result = compare([0, 1], [1]);
		expect<LexicographicComparison>(result).toBe(-1);
	});

	test("GIVEN [2, 1] and [1] THEN returns 1", () => {
		const result = compare([2, 1], [1]);
		expect<LexicographicComparison>(result).toBe(1);
	});
});
