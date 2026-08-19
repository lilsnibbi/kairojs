import { describe, expect, test } from "bun:test";
import { Identifiers } from "@/constants/identifiers.ts";
import { resolveInteger } from "@/resolvers/integer.ts";
import { Result } from "@utilities/result/index.ts";

describe("Integer resolver", () => {
	test("GIVEN a valid integer THEN returns its parsed value", () => {
		expect(resolveInteger("1")).toEqual(Result.ok(1));
	});

	test("GIVEN a valid integer with minimum THEN returns its parsed value", () => {
		expect(resolveInteger("2", { minimum: 2 })).toEqual(Result.ok(2));
	});

	test("GIVEN a valid integer with maximum THEN returns its parsed value", () => {
		expect(resolveInteger("3", { maximum: 4 })).toEqual(Result.ok(3));
	});

	test("GIVEN an integer before minimum THEN returns error", () => {
		expect(resolveInteger("1", { minimum: 2 })).toEqual(
			Result.err(Identifiers.ArgumentIntegerTooSmall),
		);
	});

	test("GIVEN an integer beyond maximum THEN returns error", () => {
		expect(resolveInteger("5", { maximum: 4 })).toEqual(
			Result.err(Identifiers.ArgumentIntegerTooLarge),
		);
	});

	test("GIVEN an invalid integer THEN returns error", () => {
		expect(resolveInteger("hello")).toEqual(
			Result.err(Identifiers.ArgumentIntegerError),
		);
	});
});
