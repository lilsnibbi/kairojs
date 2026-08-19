import { describe, expect, mock, test } from "bun:test";
import { retrySync } from "@utilities/utilities/index.ts";

describe("retrySync", () => {
	test("GIVEN a simple string return THEN returns the same on first attempt", () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		const result = retrySync(mockFunction, 3);

		expect(result).toBe("test");
		expect(mockFunction).toHaveBeenCalledTimes(1);
	});

	test("GIVEN a twice failing function THEN returns the third result", () => {
		let counter = 0;
		const callback = () => {
			if (counter < 2) {
				++counter;
				throw new Error("💣💥");
			}

			return "success!";
		};
		const mockFunction = mock(callback);

		const result = retrySync(mockFunction, 3);

		expect(result).toBe("success!");
		expect(counter).toBe(2);
		expect(mockFunction).toHaveBeenCalledTimes(3);
	});

	test("GIVEN a thrice failing function WHEN retries is lower THEN returns throws the last error", () => {
		let counter = 0;
		const callback = () => {
			if (counter < 2) {
				++counter;
				throw new Error("💣💥");
			}

			return "success!";
		};
		const mockFunction = mock<() => string>().mockImplementation(callback);

		expect(() => retrySync(mockFunction, 2)).toThrowError(new Error("💣💥"));
		expect(counter).toBe(2);
		expect(mockFunction).toHaveBeenCalledTimes(2);
	});

	test("GIVEN 0 retries THEN returns result", () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		const result = retrySync(mockFunction, 0);

		expect(result).toBe("test");
		expect(mockFunction).toHaveBeenCalledTimes(1);
	});

	test("GIVEN retries below 1 THEN throws", () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		expect(() => retrySync(mockFunction, -1)).toThrowError(
			new RangeError("Expected retries to be a number >= 0"),
		);
		expect(mockFunction).toHaveBeenCalledTimes(0);
	});
});
