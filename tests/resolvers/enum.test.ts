import { describe, expect, test } from "bun:test";
import { Identifiers } from "@/constants/identifiers.ts";
import { resolveEnum } from "@/resolvers/enum.ts";
import { Result } from "@utilities/result/index.ts";

describe("Enum resolver", () => {
	test("GIVEN a good lowercase value from one option THEN returns the string", () => {
		expect(resolveEnum("foo", { enum: ["foo"] })).toEqual(Result.ok("foo"));
	});

	test("GIVEN a good mixed-case value from one option THEN returns the string", () => {
		expect(resolveEnum("FoO", { enum: ["FoO"] })).toEqual(Result.ok("FoO"));
	});

	test("GIVEN a good value from more options THEN returns the string", () => {
		expect(resolveEnum("foo", { enum: ["foo", "bar", "baz"] })).toEqual(
			Result.ok("foo"),
		);
	});

	test("GIVEN a good case sensitive value from more options THEN returns the string", () => {
		expect(
			resolveEnum("FoO", {
				enum: ["FoO", "foo", "bar", "baz"],
				caseInsensitive: false,
			}),
		).toEqual(Result.ok("FoO"));
	});

	test("GIVEN a good value from one option THEN the result is ok", () => {
		expect(resolveEnum("foo", { enum: ["foo"] }).isOk()).toBe(true);
	});

	test("GIVEN an empty enum array THEN returns ArgumentEnumEmptyError", () => {
		expect(resolveEnum("foo")).toEqual(
			Result.err(Identifiers.ArgumentEnumEmptyError),
		);
	});

	test("GIVEN a value not listed in the array THEN returns ArgumentEnumError", () => {
		expect(resolveEnum("foo", { enum: ["bar", "baz"] })).toEqual(
			Result.err(Identifiers.ArgumentEnumError),
		);
	});

	test("GIVEN a value with the wrong case THEN returns ArgumentEnumError", () => {
		expect(
			resolveEnum("FOO", { enum: ["bar", "baz"], caseInsensitive: false }),
		).toEqual(Result.err(Identifiers.ArgumentEnumError));
	});
});
