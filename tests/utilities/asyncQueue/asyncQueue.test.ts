import { describe, expect, spyOn, test } from "bun:test";
import { AsyncQueue } from "@utilities/asyncQueue/index.ts";
import { AsyncQueueEntry } from "@utilities/asyncQueue/lib/entry.ts";
import type { AsyncQueueWaitOptions } from "@types";

/**
 * Attaches a no-op rejection handler so Bun does not report a deliberately rejected promise as an
 * unhandled rejection before the assertion further down gets to await it. The original promise is
 * untouched, so the assertions below still see the rejection.
 */
function ignoreRejection(promise: Promise<unknown>): void {
	void promise.catch(() => undefined);
}

function genNumbers(queue: AsyncQueue) {
	let i = 0;
	return async (options?: Readonly<AsyncQueueWaitOptions>): Promise<number> => {
		await queue.wait(options);
		try {
			return await Promise.resolve(++i);
		} finally {
			queue.shift();
		}
	};
}

describe("AsyncQueue", () => {
	test("GIVEN await calls THEN increments after each", async () => {
		const queue = new AsyncQueue();
		const tester = genNumbers(queue);

		expect(await tester()).toBe(1);
		expect(await tester()).toBe(2);
	});

	test("GIVEN race condition THEN entries are executed in queue order", async () => {
		const queue = new AsyncQueue();
		const tester = genNumbers(queue);

		const first = tester();
		const second = tester();
		const third = tester();

		expect(await Promise.race([second, first, third])).toBe(1);
	});

	test("GIVEN multiple calls without await THEN none is resolved", () => {
		const queue = new AsyncQueue();
		const tester = genNumbers(queue);

		void tester();
		void tester();
		void tester();

		expect(queue.remaining).toBe(3);
	});

	test("GIVEN shifting an undefined queue THEN doesn't throw", () => {
		const queue = new AsyncQueue();

		expect(queue.remaining).toBe(0);
		expect(() => queue.shift()).not.toThrow();
	});

	test("GIVEN AbortSignal on empty queue THEN does not set an abort handler", async () => {
		const queue = new AsyncQueue();
		const tester = genNumbers(queue);

		const controller = new AbortController();
		// The original suite reached into the entry's private `signal`/`signalListener` fields. Those
		// are `#private` in this implementation, so the equivalent observable fact is asserted
		// instead: no `abort` listener is ever registered on the signal.
		const addListener = spyOn(controller.signal, "addEventListener");

		const promise = tester({ signal: controller.signal });
		expect(addListener).not.toHaveBeenCalled();

		controller.abort();
		expect(queue.remaining).toBe(1);
		await expect(promise).resolves.toBe(1);
	});

	test("GIVEN non-head item with AbortSignal + abort() THEN rejects queued item and dequeues it", async () => {
		const queue = new AsyncQueue();
		const controller = new AbortController();
		const tester = genNumbers(queue);

		const addListener = spyOn(controller.signal, "addEventListener");

		const first = tester();
		const second = tester({ signal: controller.signal });
		const third = tester();
		ignoreRejection(second);

		expect(queue.remaining).toBe(3);
		// Stands in for `queue['promises'][1]['signal'] === controller.signal` and
		// `signalListener !== null`, which are `#private` here.
		expect(addListener).toHaveBeenCalledTimes(1);
		expect(addListener.mock.calls[0]![0]).toBe("abort");

		controller.abort();
		expect(queue.remaining).toBe(2);

		await expect(first).resolves.toBe(1);
		expect(queue.remaining).toBe(0);

		await expect(second).rejects.toThrowError("Request aborted manually");
		// The third entry took the aborted entry's place, so it is the one that ran second.
		await expect(third).resolves.toBe(2);
	});

	test("GIVEN non-head item with aborted AbortSignal THEN does not set an abort handler", async () => {
		const queue = new AsyncQueue();
		const controller = new AbortController();
		controller.abort();

		const addListener = spyOn(controller.signal, "addEventListener");
		const tester = genNumbers(queue);

		const first = tester();
		const second = tester({ signal: controller.signal });
		expect(queue.remaining).toBe(2);
		expect(addListener).not.toHaveBeenCalled();

		await expect(first).resolves.toBe(1);
		await expect(second).resolves.toBe(2);
	});

	test("GIVEN non-head item with AbortSignal + late abort() THEN unregisters abort listener", async () => {
		const queue = new AsyncQueue();
		const controller = new AbortController();
		const tester = genNumbers(queue);

		const removeListener = spyOn(controller.signal, "removeEventListener");

		const first = tester();
		const second = tester({ signal: controller.signal });
		expect(queue.remaining).toBe(2);

		await expect(first).resolves.toBe(1);
		expect(removeListener).toHaveBeenCalledTimes(1);

		controller.abort();
		await expect(second).resolves.toBe(2);
	});

	describe("abortAll", () => {
		test("GIVEN empty queue THEN does no operation", () => {
			const queue = new AsyncQueue();

			expect(() => queue.abortAll()).not.toThrow();
		});

		test("GIVEN queue with only the head THEN does no operation", async () => {
			const queue = new AsyncQueue();
			const tester = genNumbers(queue);

			const first = tester();
			// The original suite spied on the head entry instance; entries are unreachable from the
			// outside here, so the prototype method is spied on instead.
			const abortSpy = spyOn(AsyncQueueEntry.prototype, "abort");

			try {
				expect(() => queue.abortAll()).not.toThrow();
				expect(abortSpy).not.toHaveBeenCalled();
				expect(queue.remaining).toBe(1);
				await expect(first).resolves.toBe(1);
			} finally {
				abortSpy.mockRestore();
			}
		});

		test("GIVEN queue with several entries THEN aborts all non-head entries", async () => {
			const queue = new AsyncQueue();
			const tester = genNumbers(queue);

			const first = tester();
			const second = tester();
			const third = tester();
			ignoreRejection(second);
			ignoreRejection(third);

			const abortSpy = spyOn(AsyncQueueEntry.prototype, "abort");

			try {
				expect(() => queue.abortAll()).not.toThrow();
				// Exactly the two non-head entries were aborted; the head was left alone.
				expect(abortSpy).toHaveBeenCalledTimes(2);
				expect(queue.remaining).toBe(1);

				await expect(first).resolves.toBe(1);
				await expect(second).rejects.toThrowError("Request aborted manually");
				await expect(third).rejects.toThrowError("Request aborted manually");
			} finally {
				abortSpy.mockRestore();
			}
		});
	});
});
