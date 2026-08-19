import { describe, expect, mock, test } from "bun:test";
import type { Awaitable } from "@types";
import { retry } from "@utilities/utilities/index.ts";

/**
 * `retry` takes a `() => Awaitable<T>`, so the mocks below are declared with that same return type.
 *
 * Bun types `mockRejectedValueOnce` as taking `never` unless the mock's return type is *only* a
 * promise, which a mock that also returns synchronously is not. The rejecting attempts are
 * therefore spelled out as the rejected promise `mockRejectedValueOnce` would itself have produced,
 * which keeps each attempt's runtime behaviour exactly as it was.
 */
function rejectsWith(value: unknown): () => Awaitable<string> {
	return () => Promise.reject(value);
}

describe("retry", () => {
	test("GIVEN a simple string return THEN returns the same on first attempt", async () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		const result = await retry(mockFunction, 3);

		expect(result).toBe("test");
		expect(mockFunction).toHaveBeenCalledTimes(1);
	});

	test("GIVEN a twice failing function THEN returns the third result", async () => {
		const mockFunction = mock<() => Awaitable<string>>() //
			.mockImplementationOnce(rejectsWith("💣💥"))
			.mockImplementationOnce(rejectsWith("💣💥"))
			.mockReturnValueOnce("success!");

		const result = await retry(mockFunction, 3);

		expect(result).toBe("success!");
		expect(mockFunction).toHaveBeenCalledTimes(3);
	});

	test("GIVEN a thrice failing function WHEN retries is lower THEN returns throws the last error", async () => {
		const mockFunction = mock<() => Awaitable<string>>() //
			.mockImplementationOnce(rejectsWith("💣💥"))
			.mockImplementationOnce(rejectsWith("💣💥"))
			.mockImplementationOnce(rejectsWith("💣💥"));

		await expect(retry(mockFunction, 2)).rejects.toThrowError("💣💥");
		expect(mockFunction).toHaveBeenCalledTimes(2);
	});

	test("GIVEN 0 retries THEN returns result", async () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		const result = await retry(mockFunction, 0);

		expect(result).toBe("test");
		expect(mockFunction).toHaveBeenCalledTimes(1);
	});

	test("GIVEN retries below 1 THEN throws", async () => {
		const mockFunction = mock<() => string>().mockReturnValue("test");
		await expect(retry(mockFunction, -1)).rejects.toThrowError(
			new RangeError("Expected retries to be a number >= 0"),
		);
		expect(mockFunction).toHaveBeenCalledTimes(0);
	});
});
