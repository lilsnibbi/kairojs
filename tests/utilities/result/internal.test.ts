import { describe, expect, mock, test } from "bun:test";
import { isFunction, isPromise } from "@utilities/result/lib/internal.ts";

describe("internal", () => {
	describe("isFunction", () => {
		test("GIVEN a function THEN returns true", () => {
			const callback = mock();

			expect(isFunction(callback)).toBe(true);
			expect(callback).not.toHaveBeenCalled();
		});

		test.each([null, undefined, 42, "Hello World", {}])(
			"GIVEN %j THEN returns false",
			(value) => {
				expect(isFunction(value)).toBe(false);
			},
		);
	});

	describe("isPromise", () => {
		test("GIVEN a promise THEN returns true", () => {
			const value = Promise.resolve(42);

			expect(isPromise(value)).toBe(true);
		});

		test("GIVEN a rejecting promise THEN returns true", () => {
			const value = Promise.reject(new Error());

			expect(isPromise(value)).toBe(true);

			void value.catch(mock());
		});

		test("GIVEN a promise-like THEN returns true", () => {
			const callback = mock();
			// biome-ignore lint/suspicious/noThenProperty: the test deliberately builds a thenable to check detection
			const value = { then: callback };

			expect(isPromise(value)).toBe(true);
			expect(callback).not.toHaveBeenCalled();
		});

		test.each([null, undefined, 42, "Hello World", {}])(
			"GIVEN %j THEN returns false",
			(value) => {
				expect(isPromise(value)).toBe(false);
			},
		);
	});
});
