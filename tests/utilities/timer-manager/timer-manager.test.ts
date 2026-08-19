import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TimerManager } from "@utilities/timer-manager/index.ts";

/**
 * The original suite read `TimerManager['storedTimeouts'].size` and `['storedIntervals'].size`
 * directly. Both sets are `#private` static fields here, so their sizes are measured instead by
 * counting how many times `destroy()` calls the global `clearTimeout` / `clearInterval` — it does
 * so exactly once per tracked timer.
 *
 * Measuring therefore also empties the sets, which is why each test creates a fresh timer for every
 * measurement rather than reading the same one repeatedly.
 */
function measureTrackedTimers(): { timeouts: number; intervals: number } {
	const clearTimeoutSpy = spyOn(globalThis, "clearTimeout");
	const clearIntervalSpy = spyOn(globalThis, "clearInterval");

	try {
		TimerManager.destroy();
		return {
			timeouts: clearTimeoutSpy.mock.calls.length,
			intervals: clearIntervalSpy.mock.calls.length,
		};
	} finally {
		clearTimeoutSpy.mockRestore();
		clearIntervalSpy.mockRestore();
	}
}

describe("TimerManager", () => {
	afterEach(() => {
		// `vi.clearAllTimers()` has no Bun equivalent; `destroy()` cancels everything this suite
		// created, which is what the original pairing achieved.
		TimerManager.destroy();
	});

	test('GIVEN "new" THEN throws error', () => {
		const given = () => new (TimerManager as unknown as new () => unknown)();

		// JavaScriptCore words this differently from V8's "Super constructor null of TimerManager is
		// not a constructor", but the behaviour is the same: the class cannot be constructed.
		expect(given).toThrowError(TypeError);
		expect(given).toThrowError("is not a constructor");
	});

	test("GIVEN setTimeout static THEN creates and resolves timeout", async () => {
		expect.assertions(2);

		expect(measureTrackedTimers().timeouts).toBe(0);

		await new Promise<void>((done) =>
			TimerManager.setTimeout(() => {
				expect(true).toBe(true);
				done();
			}, 20),
		);
	});

	test("GIVEN setTimeout with clear THEN creates but clears timeout", () => {
		expect.assertions(3);

		expect(measureTrackedTimers().timeouts).toBe(0);

		TimerManager.setTimeout(() => {
			throw new Error("Woops, the TimerManager got into the timeout");
		}, 20_000);

		// Creating a timeout tracks exactly one.
		expect(measureTrackedTimers().timeouts).toBe(1);

		const timer = TimerManager.setTimeout(() => {
			throw new Error("Woops, the TimerManager got into the timeout");
		}, 20_000);

		TimerManager.clearTimeout(timer);

		// `clearTimeout` untracked it, so there is nothing left for `destroy()` to clear.
		expect(measureTrackedTimers().timeouts).toBe(0);
	});

	test("GIVEN setInterval static THEN resolves given amount of times", async () => {
		expect.assertions(4);

		expect(measureTrackedTimers().intervals).toBe(0);

		let i = 0;
		await new Promise<void>((done) => {
			const interval = TimerManager.setInterval(() => {
				if (++i < 3) {
					// The original asserted the interval was still tracked at this point. Tracking is
					// unreadable without destroying it, so its observable consequence is asserted
					// instead: the interval is still ticking.
					expect(i).toBeLessThan(3);
				} else {
					TimerManager.clearInterval(interval);
					done();
				}
			}, 20);
		});

		// `clearInterval` untracked it, so there is nothing left for `destroy()` to clear.
		expect(measureTrackedTimers().intervals).toBe(0);
	});

	test("GIVEN timer+interval->destroy THEN removes all", () => {
		expect.assertions(4);

		expect(measureTrackedTimers()).toEqual({ timeouts: 0, intervals: 0 });

		TimerManager.setTimeout(() => {
			throw new Error("Woops, the TimerManager got into the timeout");
		}, 20_000);

		expect(measureTrackedTimers()).toEqual({ timeouts: 1, intervals: 0 });

		TimerManager.setTimeout(() => {
			throw new Error("Woops, the TimerManager got into the timeout");
		}, 20_000);

		TimerManager.setInterval(() => {
			throw new Error("Woops, the TimerManager got into the interval");
		}, 20_000);

		expect(measureTrackedTimers()).toEqual({ timeouts: 1, intervals: 1 });

		// The measurement above ran `destroy()`, which removed both, so nothing is left to clear.
		expect(measureTrackedTimers()).toEqual({ timeouts: 0, intervals: 0 });
	});
});
