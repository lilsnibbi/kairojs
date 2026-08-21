import { describe, expect, test } from "bun:test";
import { LogLevel } from "@/logger/logLevel.ts";
import { Logger } from "@/logger/logger.ts";
import { isClass } from "@utilities/common/index.ts";

// The upstream suite listed `Trace` twice and left `None` out. `None` is a real entry in the format
// map and doubles as the fallback style, so it is listed here instead of the duplicate.
const levels = [
	LogLevel.Trace,
	LogLevel.Debug,
	LogLevel.Info,
	LogLevel.Warn,
	LogLevel.Error,
	LogLevel.Fatal,
	LogLevel.None,
] as const;

describe("Logger", () => {
	test("Logger should be a class", () => {
		expect(isClass(Logger)).toBe(true);
	});

	test("Empty Constructor", () => {
		const logger = new Logger();
		expect(logger.depth).toBe(0);
		expect(logger.formats.size).toBe(7);
		for (const level of levels) {
			expect(logger.formats.has(level)).toBe(true);
		}
		expect(logger.join).toBe(" ");
		expect(logger.level).toBe(LogLevel.Info);
	});

	test("Empty Object Constructor", () => {
		const logger = new Logger({});
		expect(logger.depth).toBe(0);
		expect(logger.formats.size).toBe(7);
		for (const level of levels) {
			expect(logger.formats.has(level)).toBe(true);
		}
		expect(logger.join).toBe(" ");
		expect(logger.level).toBe(LogLevel.Info);
	});

	test("Depth", () => {
		const logger = new Logger({ depth: 2 });
		expect(logger.depth).toBe(2);
	});

	test("Join", () => {
		const logger = new Logger({ join: "\n" });
		expect(logger.join).toBe("\n");
	});

	test("Level", () => {
		const logger = new Logger({ level: LogLevel.Debug });
		expect(logger.level).toBe(LogLevel.Debug);
	});

	test("Level shorthand", () => {
		const logger = new Logger(LogLevel.Warn);
		expect(logger.level).toBe(LogLevel.Warn);
	});

	test("has", () => {
		const logger = new Logger({ level: LogLevel.Info });
		expect(logger.has(LogLevel.Debug)).toBe(false);
		expect(logger.has(LogLevel.Info)).toBe(true);
		expect(logger.has(LogLevel.Error)).toBe(true);
	});
});
