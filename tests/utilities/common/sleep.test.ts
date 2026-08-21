import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { sleep } from "@utilities/common/index.ts";

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

describe("sleep", () => {
	// `bun:test` has no fake timer API, so the two timing tests below use real timers and assert
	// that at least the requested amount of wall-clock time elapsed, with a generous upper bound to
	// keep the assertion meaningful.
	test("GIVEN a number of ms THEN resolve the promise after that time", async () => {
		const start = Date.now();
		const result = sleep(50);

		await expect<Promise<undefined>>(result).resolves.toBe(undefined);

		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(50);
		expect(elapsed).toBeLessThan(1000);
	});

	test("GIVEN a number of ms and a value THEN resolve the promise after that time with the value", async () => {
		const start = Date.now();
		const result = sleep(50, "test");

		await expect<Promise<string>>(result).resolves.toBe("test");

		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(50);
		expect(elapsed).toBeLessThan(1000);
	});

	test("GIVEN an aborted signal THEN the promise rejects without a timeout", async () => {
		const signal = AbortSignal.abort();
		const setTimeoutSpy = spyOn(globalThis, "setTimeout");
		const clearTimeoutSpy = spyOn(globalThis, "clearTimeout");
		restorers.push(
			() => setTimeoutSpy.mockRestore(),
			() => clearTimeoutSpy.mockRestore(),
		);

		const promise = sleep(50, undefined, { signal });

		await expectRejectedWithAbortReason(
			promise,
			"AbortError",
			() => signal.reason,
		);
		expect(setTimeoutSpy).toHaveBeenCalledTimes(0);
		expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);
	});

	test("GIVEN an immediately aborted signal THEN the promise rejects", async () => {
		const controller = new AbortController();
		const setTimeoutSpy = spyOn(globalThis, "setTimeout");
		const clearTimeoutSpy = spyOn(globalThis, "clearTimeout");
		restorers.push(
			() => setTimeoutSpy.mockRestore(),
			() => clearTimeoutSpy.mockRestore(),
		);

		const promise = sleep(50, undefined, { signal: controller.signal });
		controller.abort();

		await expectRejectedWithAbortReason(
			promise,
			"AbortError",
			() => controller.signal.reason,
		);
		expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
	});

	test("GIVEN an immediately aborted signal with a reason THEN reject the promise with the reason as cause", async () => {
		const controller = new AbortController();
		const promise = sleep(50, undefined, { signal: controller.signal });
		controller.abort("Too late!");
		await expect(promise).rejects.toStrictEqual("Too late!");
	});
});
