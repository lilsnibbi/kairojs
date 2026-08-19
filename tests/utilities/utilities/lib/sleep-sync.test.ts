import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { sleepSync } from "@utilities/utilities/index.ts";

let restoreDateNow: (() => void) | undefined;

afterEach(() => {
	restoreDateNow?.();
	restoreDateNow = undefined;
});

describe("sleepSync", () => {
	test("GIVEN a number of ms THEN return after that time", () => {
		const dateNow = spyOn(Date, "now") //
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(25)
			.mockReturnValueOnce(50)
			.mockReturnValueOnce(50);
		restoreDateNow = () => dateNow.mockRestore();

		expect<undefined>(sleepSync(50)).toBe(undefined);
		expect(Date.now()).toBe(50);
	});

	test("GIVEN a number of ms and a value THEN return after that time with the value", () => {
		const dateNow = spyOn(Date, "now") //
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(50)
			.mockReturnValueOnce(50);
		restoreDateNow = () => dateNow.mockRestore();

		expect<string>(sleepSync(50, "test")).toBe("test");
		expect(Date.now()).toBe(50);
	});
});
