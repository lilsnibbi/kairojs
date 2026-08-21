import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { pollSync } from "@utilities/common/index.ts";

const DOMExceptionCtor: typeof globalThis.DOMException =
	globalThis.DOMException ?? AbortSignal.abort().reason.constructor;

const restorers: (() => void)[] = [];

afterEach(() => {
	while (restorers.length > 0) restorers.pop()!();
});

describe("pollSync", () => {
	const pass = "success!";
	const fail = "fail!";
	const callbackRaw = () => pass;
	const conditionRaw = (result: string) => result === pass;

	test("GIVEN a poll with no retries THEN returns first attempt", () => {
		const callback = mock(() => pass);
		const condition = mock(conditionRaw);
		const result = pollSync(callback, condition, { maximumRetries: 0 });

		expect(result).toBe(pass);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(condition).toHaveBeenCalledTimes(0);
	});

	test("GIVEN a function that fails twice then succeeds THEN calls that function thrice", () => {
		const callback = mock<() => string>() //
			.mockReturnValueOnce(fail)
			.mockReturnValueOnce(fail)
			.mockReturnValueOnce(pass);
		const condition = mock(conditionRaw);
		const result = pollSync(callback, condition);

		expect(result).toBe(pass);
		expect(callback).toHaveBeenCalledTimes(3);
		expect(condition).toHaveBeenCalledTimes(3);
	});

	describe("maximumRetries", () => {
		const callback = () => pass;

		test.each([undefined, null, 0, 5, Infinity])(
			"GIVEN %j THEN passes validation",
			(maximumRetries) => {
				const result = pollSync(callback, conditionRaw, { maximumRetries });
				expect(result).toBe(pass);
			},
		);

		test.each(["foo", true])(
			"GIVEN %j THEN throws TypeError",
			(maximumRetries) => {
				const thrownCall = () =>
					// @ts-expect-error invalid type
					pollSync(callback, conditionRaw, { maximumRetries });
				expect(thrownCall).toThrowError(
					new TypeError("Expected maximumRetries to be a number"),
				);
			},
		);

		test.each([NaN, -NaN, -Infinity, -5])(
			"GIVEN %j THEN throws RangeError",
			(maximumRetries) => {
				const thrownCall = () =>
					pollSync(callback, conditionRaw, { maximumRetries });
				expect(thrownCall).toThrowError(
					new RangeError("Expected maximumRetries to be a non-negative number"),
				);
			},
		);

		test("GIVEN a poll with only one retry and fails both THEN calls that function twice, but condition only once", () => {
			const innerCallback = mock<() => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(fail);
			const condition = mock((result: string) => result === pass);
			const result = pollSync(innerCallback, condition, { maximumRetries: 1 });

			expect(result).toBe(fail);
			expect(innerCallback).toHaveBeenCalledTimes(2);
			expect(condition).toHaveBeenCalledTimes(1);
		});

		test("GIVEN a poll with two retries and succeeds first THEN calls that function and condition once", () => {
			const innerCallback = mock(() => pass);
			const condition = mock((result: string) => result === pass);
			const result = pollSync(innerCallback, condition, { maximumRetries: 2 });

			expect(result).toBe(pass);
			expect(innerCallback).toHaveBeenCalledTimes(1);
			expect(condition).toHaveBeenCalledTimes(1);
		});
	});

	describe("waitBetweenRetries", () => {
		test.each([undefined, null, 0, 5])(
			"GIVEN %j THEN passes validation",
			(waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const result = pollSync(callback, condition, { waitBetweenRetries });

				expect(result).toBe(pass);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(condition).toHaveBeenCalledTimes(1);
			},
		);

		test.each(["foo", true])(
			"GIVEN %j THEN throws TypeError",
			(waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const thrownCall = () =>
					pollSync(callback, condition, {
						waitBetweenRetries: waitBetweenRetries as any,
					});

				expect(thrownCall).toThrowError(
					new TypeError("Expected waitBetweenRetries to be a number"),
				);
				expect(callback).toHaveBeenCalledTimes(0);
				expect(condition).toHaveBeenCalledTimes(0);
			},
		);

		test.each([NaN, -NaN, -Infinity, -5, Infinity, 5.5])(
			"GIVEN %j THEN throws RangeError",
			(waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const thrownCall = () =>
					pollSync(callback, condition, { waitBetweenRetries });

				expect(thrownCall).toThrowError(
					new RangeError(
						"Expected waitBetweenRetries to be a positive safe integer",
					),
				);
				expect(callback).toHaveBeenCalledTimes(0);
				expect(condition).toHaveBeenCalledTimes(0);
			},
		);

		test("GIVEN a poll with a wait of 5ms THEN waits 5ms between retries", () => {
			const callback = mock<() => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const condition = mock(conditionRaw);
			const dateNow = spyOn(Date, "now")
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(0) // sleepSync start
				.mockReturnValueOnce(5) // sleepSync end
				.mockReturnValueOnce(5) // sleepSync start
				.mockReturnValueOnce(10); // sleepSync end
			restorers.push(() => dateNow.mockRestore());

			const result = pollSync(callback, condition, { waitBetweenRetries: 5 });

			expect(result).toBe(pass);
			expect(dateNow).toHaveBeenCalledTimes(5);
		});
	});

	describe("timeout", () => {
		const callback = () => pass;

		test.each([undefined, null, 0, 5, Infinity])(
			"GIVEN %j THEN passes validation",
			(timeout) => {
				const result = pollSync(callback, conditionRaw, { timeout });
				expect(result).toBe(pass);
			},
		);

		test.each(["foo", true])("GIVEN %j THEN throws TypeError", (timeout) => {
			// @ts-expect-error invalid type
			const thrownCall = () => pollSync(callback, conditionRaw, { timeout });
			expect(thrownCall).toThrowError(
				new TypeError("Expected timeout to be a number"),
			);
		});

		test.each([NaN, -NaN, -Infinity, -5])(
			"GIVEN %j THEN throws RangeError",
			(timeout) => {
				const thrownCall = () => pollSync(callback, conditionRaw, { timeout });
				expect(thrownCall).toThrowError(
					new RangeError("Expected timeout to be a non-negative number"),
				);
			},
		);

		test("GIVEN a poll with 5ms timeout but takes longer THEN throws an error", () => {
			const innerCallback = mock<() => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(fail);
			const condition = mock((result: string) => result === pass);
			const dateNow = spyOn(Date, "now")
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(0) // deadline check
				.mockReturnValueOnce(5) // sleepSync start
				.mockReturnValueOnce(5) // sleepSync loop
				.mockReturnValueOnce(10) // sleepSync end
				.mockReturnValueOnce(10); // deadline check
			restorers.push(() => dateNow.mockRestore());

			const thrownCall = () =>
				pollSync(innerCallback, condition, {
					timeout: 5,
					waitBetweenRetries: 5,
				});

			expect(thrownCall).toThrowError(
				new DOMExceptionCtor("This operation was aborted", "AbortError"),
			);
			expect(innerCallback).toHaveBeenCalledTimes(2);
			expect(condition).toHaveBeenCalledTimes(2);
			expect(dateNow).toHaveBeenCalledTimes(6);
		});
	});

	describe("verbose", () => {
		test("GIVEN verbose but no waitBetweenRetries THEN does not call console.log", () => {
			const callback = mock<() => string>()
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const consoleLog = spyOn(console, "log").mockImplementation(
				() => undefined,
			);
			restorers.push(() => consoleLog.mockRestore());

			const result = pollSync(callback, conditionRaw, { verbose: true });

			expect(result).toBe(pass);
			expect(consoleLog).toHaveBeenCalledTimes(0);
		});

		test("GIVEN verbose and waitBetweenRetries THEN calls console.log on retry", () => {
			const callback = mock<() => string>()
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const consoleLog = spyOn(console, "log").mockImplementation(
				() => undefined,
			);
			restorers.push(() => consoleLog.mockRestore());

			const result = pollSync(callback, conditionRaw, {
				verbose: true,
				waitBetweenRetries: 5,
			});

			expect(result).toBe(pass);
			expect(consoleLog).toHaveBeenCalledTimes(1);
			expect(consoleLog).toHaveBeenCalledWith(
				"Waiting 5ms before polling again...",
			);
		});
	});
});
