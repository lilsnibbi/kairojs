import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { poll } from "@utilities/common/index.ts";

const DOMExceptionCtor: typeof globalThis.DOMException =
	globalThis.DOMException ?? AbortSignal.abort().reason.constructor;

const restorers: (() => void)[] = [];

afterEach(() => {
	while (restorers.length > 0) restorers.pop()!();
});

/**
 * The original suite compared the rejection against a freshly built `DOMException`. That does not
 * survive the move to Bun for two reasons: Bun's `DOMException` instances carry their own
 * `stack`/`sourceURL`/`line`/`column` properties (so two structurally identical instances are never
 * `toStrictEqual`), and the abort message the engine itself generates is worded differently
 * ("The operation was aborted." rather than Node's "This operation was aborted"). Asserting that
 * the rejection *is* the signal's own abort reason, and that it is a `DOMException` with the
 * expected name, checks the same behaviour without depending on either.
 */
async function expectRejectedWithAbortReason(
	promise: Promise<unknown>,
	name: string,
	getReason: () => unknown,
) {
	let thrown: unknown;
	let rejected = false;

	try {
		await promise;
	} catch (error) {
		rejected = true;
		thrown = error;
	}

	expect(rejected).toBe(true);
	expect(thrown).toBeInstanceOf(DOMExceptionCtor);
	expect((thrown as DOMException).name).toBe(name);
	expect(thrown).toBe(getReason());
}

describe("poll", () => {
	const pass = "success!";
	const fail = "fail!";
	const callbackRaw = () => pass;
	const conditionRaw = (result: string) => result === pass;

	test("GIVEN a poll with no retries THEN returns first attempt", async () => {
		const callback = mock<(signal?: AbortSignal | undefined) => string>(
			() => pass,
		);
		const condition =
			mock<(result: string, signal?: AbortSignal | undefined) => boolean>(
				conditionRaw,
			);
		const result = poll(callback, condition, { maximumRetries: 0 });

		await expect(result).resolves.toBe(pass);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(undefined);
		expect(condition).toHaveBeenCalledTimes(0);
	});

	test("GIVEN a function that fails twice then succeeds THEN calls that function thrice", async () => {
		const callback = mock<() => string>() //
			.mockReturnValueOnce(fail)
			.mockReturnValueOnce(fail)
			.mockReturnValueOnce(pass);
		const condition = mock(conditionRaw);
		const result = poll(callback, condition);

		await expect(result).resolves.toBe(pass);
		expect(callback).toHaveBeenCalledTimes(3);
		expect(condition).toHaveBeenCalledTimes(3);
	});

	describe("signal", () => {
		test("GIVEN an AbortSignal that is aborted before the first call THEN throws", async () => {
			const callback = mock(callbackRaw);
			const condition = mock(conditionRaw);
			const signal = AbortSignal.abort();
			const result = poll(callback, condition, { signal });

			await expectRejectedWithAbortReason(
				result,
				"AbortError",
				() => signal.reason,
			);
			expect(callback).toHaveBeenCalledTimes(0);
			expect(condition).toHaveBeenCalledTimes(0);
		});

		test("GIVEN an AbortSignal that is aborted in the condition THEN throws without retry", async () => {
			const controller = new AbortController();
			const callback = mock(() => fail);
			const condition = mock((result: string) => {
				controller.abort();
				return result === pass;
			});
			const result = poll(callback, condition, { signal: controller.signal });

			await expectRejectedWithAbortReason(
				result,
				"AbortError",
				() => controller.signal.reason,
			);
			expect(callback).toHaveBeenCalledTimes(1);
			expect(condition).toHaveBeenCalledTimes(1);
		});
	});

	describe("maximumRetries", () => {
		const callback = () => pass;

		test.each([undefined, null, 0, 5, Infinity])(
			"GIVEN %j THEN passes validation",
			async (maximumRetries) => {
				const result = poll(callback, conditionRaw, { maximumRetries });
				await expect(result).resolves.toBe(pass);
			},
		);

		test.each(["foo", true])(
			"GIVEN %j THEN throws TypeError",
			async (maximumRetries) => {
				// @ts-expect-error invalid type
				const result = poll(callback, conditionRaw, { maximumRetries });
				await expect(result).rejects.toStrictEqual(
					new TypeError("Expected maximumRetries to be a number"),
				);
			},
		);

		test.each([NaN, -NaN, -Infinity, -5])(
			"GIVEN %j THEN throws RangeError",
			async (maximumRetries) => {
				const result = poll(callback, conditionRaw, { maximumRetries });
				await expect(result).rejects.toStrictEqual(
					new RangeError("Expected maximumRetries to be a non-negative number"),
				);
			},
		);

		test("GIVEN a poll with only one retry and fails both THEN calls that function twice, but condition only once", async () => {
			const innerCallback = mock<() => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(fail);
			const condition = mock((result: string) => result === pass);
			const result = poll(innerCallback, condition, { maximumRetries: 1 });

			await expect(result).resolves.toBe(fail);
			expect(innerCallback).toHaveBeenCalledTimes(2);
			expect(condition).toHaveBeenCalledTimes(1);
		});

		test("GIVEN a poll with two retries and succeeds first THEN calls that function and condition once", async () => {
			const innerCallback = mock(() => pass);
			const condition = mock((result: string) => result === pass);
			const result = poll(innerCallback, condition, { maximumRetries: 2 });

			await expect(result).resolves.toBe(pass);
			expect(innerCallback).toHaveBeenCalledTimes(1);
			expect(condition).toHaveBeenCalledTimes(1);
		});
	});

	describe("waitBetweenRetries", () => {
		test.each([undefined, null, 0, 5])(
			"GIVEN %j THEN passes validation",
			async (waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const result = poll(callback, condition, { waitBetweenRetries });

				await expect(result).resolves.toBe(pass);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(condition).toHaveBeenCalledTimes(1);
			},
		);

		test.each(["foo", true])(
			"GIVEN %j THEN throws TypeError",
			async (waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const result = poll(callback, condition, {
					waitBetweenRetries: waitBetweenRetries as any,
				});

				await expect(result).rejects.toStrictEqual(
					new TypeError("Expected waitBetweenRetries to be a number"),
				);
				expect(callback).toHaveBeenCalledTimes(0);
				expect(condition).toHaveBeenCalledTimes(0);
			},
		);

		test.each([NaN, -NaN, -Infinity, -5, Infinity, 5.5])(
			"GIVEN %j THEN throws RangeError",
			async (waitBetweenRetries) => {
				const callback = mock(callbackRaw);
				const condition = mock(conditionRaw);
				const result = poll(callback, condition, { waitBetweenRetries });

				await expect(result).rejects.toStrictEqual(
					new RangeError(
						"Expected waitBetweenRetries to be a positive safe integer",
					),
				);
				expect(callback).toHaveBeenCalledTimes(0);
				expect(condition).toHaveBeenCalledTimes(0);
			},
		);

		test("GIVEN a poll with a wait of 5ms THEN waits 5ms between retries", async () => {
			const callback = mock<() => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const condition = mock(conditionRaw);

			const timeout = spyOn(globalThis, "setTimeout").mockImplementationOnce(((
				handler: () => void,
			) => {
				handler();
				return 0;
			}) as unknown as typeof setTimeout);
			restorers.push(() => timeout.mockRestore());

			const result = poll(callback, condition, { waitBetweenRetries: 5 });
			await expect(result).resolves.toBe(pass);
			expect(timeout).toHaveBeenCalledTimes(1);
			expect(timeout.mock.calls[0]![1]).toBe(5);
		});

		// The original suite drove this with vitest fake timers; `bun:test` has no equivalent, so it
		// runs on real timers instead: the 5ms `AbortSignal.timeout` fires while the poll is waiting
		// out its 10ms retry delay, which is exactly the behaviour under test.
		test("GIVEN a poll whose signal times out during the wait THEN rejects with a TimeoutError", async () => {
			const callback = mock<(signal?: AbortSignal | undefined) => string>() //
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const condition =
				mock<(result: string, signal?: AbortSignal | undefined) => boolean>(
					conditionRaw,
				);

			const signal = AbortSignal.timeout(5);
			const result = poll(callback, condition, {
				signal,
				waitBetweenRetries: 10,
			});

			await expectRejectedWithAbortReason(
				result,
				"TimeoutError",
				() => signal.reason,
			);
			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(signal);
			expect(condition).toHaveBeenCalledTimes(1);
			expect(condition).toHaveBeenCalledWith(fail, signal);
		});
	});

	describe("verbose", () => {
		test("GIVEN verbose but no waitBetweenRetries THEN does not call console.log", async () => {
			const callback = mock<() => string>()
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const consoleLog = spyOn(console, "log").mockImplementation(
				() => undefined,
			);
			restorers.push(() => consoleLog.mockRestore());

			const result = poll(callback, conditionRaw, { verbose: true });

			await expect(result).resolves.toBe(pass);
			expect(consoleLog).toHaveBeenCalledTimes(0);
		});

		test("GIVEN verbose and waitBetweenRetries THEN calls console.log on retry", async () => {
			const callback = mock<() => string>()
				.mockReturnValueOnce(fail)
				.mockReturnValueOnce(pass);
			const consoleLog = spyOn(console, "log").mockImplementation(
				() => undefined,
			);
			restorers.push(() => consoleLog.mockRestore());

			const result = poll(callback, conditionRaw, {
				verbose: true,
				waitBetweenRetries: 5,
			});

			await expect(result).resolves.toBe(pass);
			expect(consoleLog).toHaveBeenCalledTimes(1);
			expect(consoleLog).toHaveBeenCalledWith(
				"Waiting 5ms before polling again...",
			);
		});
	});
});
