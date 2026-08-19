import { describe, expect, spyOn, test } from "bun:test";
import { RateLimitManager } from "@utilities/ratelimits/index.ts";
import type { RateLimit } from "@utilities/ratelimits/index.ts";

describe("RateLimitManager", () => {
	test("Acquiring", () => {
		const manager = new RateLimitManager(1000, 1);

		const ratelimit1 = manager.acquire("one");
		const ratelimit2 = manager.acquire("two");
		expect<RateLimit<string> | undefined>(ratelimit1).toBe(manager.get("one"));
		expect<RateLimit<string> | undefined>(ratelimit2).toBe(manager.get("two"));
	});

	test("Basic Consume", () => {
		const manager = new RateLimitManager(30000, 2);

		const ratelimit = manager.acquire("one");
		ratelimit.consume().consume();
		expect(() => ratelimit.consume()).toThrow(
			"Cannot consume a limited bucket",
		);
	});

	test("Proper resetting", async () => {
		const manager = new RateLimitManager(1000, 2);

		const ratelimit = manager.acquire("one");
		ratelimit.consume().consume();

		expect(ratelimit.limited).toBe(true);

		// Sleep for 1.2 seconds because of how timers work.
		await Bun.sleep(1200);

		expect(ratelimit.limited).toBe(false);
		expect(() => ratelimit.consume()).not.toThrow();
	});

	test("Proper sweeping (everything)", async () => {
		// The original suite read `manager['sweepInterval']` directly. The sweep interval is a
		// `#private` field here, so the equivalent observable fact is asserted instead: the interval
		// is created once and cleared again as soon as the manager empties.
		const setIntervalSpy = spyOn(globalThis, "setInterval");
		const clearIntervalSpy = spyOn(globalThis, "clearInterval");

		try {
			const manager = new RateLimitManager(1000, 2);

			manager.acquire("one").consume();
			expect(setIntervalSpy).toHaveBeenCalledTimes(1);

			// Sleep for 1.2 seconds because of how timers work.
			await Bun.sleep(1200);
			manager.sweep();

			expect(manager.has("one")).toBe(false);
			expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
		} finally {
			setIntervalSpy.mockRestore();
			clearIntervalSpy.mockRestore();
		}
	});

	test("Proper sweeping (not everything)", async () => {
		const setIntervalSpy = spyOn(globalThis, "setInterval");
		const clearIntervalSpy = spyOn(globalThis, "clearInterval");

		try {
			const manager = new RateLimitManager(1000, 2);

			manager.acquire("one").consume();
			expect(setIntervalSpy).toHaveBeenCalledTimes(1);

			// Sleep for 1.2 seconds because of how timers work.
			await Bun.sleep(1200);
			manager.acquire("two").consume();
			manager.sweep();

			expect(manager.has("one")).toBe(false);
			expect(manager.has("two")).toBe(true);
			// The sweeper is still running, so it was never cleared.
			expect(clearIntervalSpy).not.toHaveBeenCalled();
		} finally {
			setIntervalSpy.mockRestore();
			clearIntervalSpy.mockRestore();
		}
	});
});
