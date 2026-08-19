import { describe, expect, test } from "bun:test";
import { isThenable } from "@utilities/utilities/index.ts";

describe("isThenable", () => {
	test("GIVEN string THEN returns false", () => {
		const value = "Hello World";
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN number THEN returns false", () => {
		const value = 420;
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN bigint THEN returns false", () => {
		const value = BigInt(420);
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN boolean THEN returns false", () => {
		const value = true;
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN undefined THEN returns false", () => {
		const value = undefined;
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN object THEN returns false", () => {
		const value = { class: "" };
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN null THEN returns false", () => {
		const value = null;
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN promise-constructor THEN returns true", () => {
		const value = new Promise((resolve): void => resolve(true));
		expect(isThenable(value)).toBe(true);
	});

	test("GIVEN promise-resolve THEN returns true", () => {
		const value = Promise.resolve(true);
		expect(isThenable(value)).toBe(true);
	});

	test("GIVEN promise-like THEN returns true", () => {
		const value = {
			// biome-ignore lint/suspicious/noThenProperty: the test deliberately builds a thenable to check detection
			then(): boolean {
				return true;
			},
			catch(): void {
				/* noop */
			},
		};
		expect(isThenable(value)).toBe(true);
	});

	test("GIVEN function THEN returns false", () => {
		const value = function value(): void {
			/* noop */
		};
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN arrow THEN returns false", () => {
		const value = (): void => {
			/* noop */
		};
		expect(isThenable(value)).toBe(false);
	});

	test("GIVEN class THEN returns false", () => {
		const value = class A {};
		expect(isThenable(value)).toBe(false);
	});
});
