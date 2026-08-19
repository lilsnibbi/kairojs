import { describe, expect, test } from "bun:test";
import { Stopwatch } from "@utilities/stopwatch/index.ts";
import { sleep } from "./shared.ts";

describe("Duration", () => {
	test("duration(running)", async () => {
		const stopwatch = new Stopwatch();

		const first = stopwatch.duration;

		await sleep(1000);
		stopwatch.stop();
		const second = stopwatch.duration;

		expect(first < second).toBe(true);
	});
});
