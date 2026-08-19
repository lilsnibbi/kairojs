import { describe, expect, test } from "bun:test";
import { LoggerStyleText, colors } from "@/logger/colors.ts";
import { LoggerLevel } from "@/logger/logger.ts";
import { isClass } from "@utilities/utilities/index.ts";

// The upstream suite compared against `colorette`. Kairo has no third-party dependencies, so the
// same styling functions come from the framework's own `colors` table.
const { reset, yellow } = colors;

describe("LoggerLevel", () => {
	test("LoggerLevel should be a class", () => {
		expect(isClass(LoggerLevel)).toBe(true);
	});

	test("Empty Constructor", () => {
		const level = new LoggerLevel();
		expect(level.infix).toBe("");
		expect(level.message).not.toBeNull();
		expect(level.message!.style).toBe(reset);
		expect(level.timestamp).not.toBeNull();
		expect(level.timestamp!.color).not.toBeNull();
		expect(level.timestamp!.color!.style).toBe(reset);
		expect(level.timestamp!.formatter("SHARD 0")).toBe("SHARD 0 - ");
		expect(level.timestamp!.timestamp.pattern).toBe("YYYY-MM-DD HH:mm:ss");
		expect(level.timestamp!.utc).toBe(false);
	});

	test("Empty Object Constructor", () => {
		const level = new LoggerLevel({});
		expect(level.infix).toBe("");
		expect(level.message).not.toBeNull();
		expect(level.message!.style).toBe(reset);
		expect(level.timestamp).not.toBeNull();
		expect(level.timestamp!.color).not.toBeNull();
		expect(level.timestamp!.color!.style).toBe(reset);
		expect(level.timestamp!.formatter("SHARD 0")).toBe("SHARD 0 - ");
		expect(level.timestamp!.timestamp.pattern).toBe("YYYY-MM-DD HH:mm:ss");
		expect(level.timestamp!.utc).toBe(false);
	});

	test("Infix", () => {
		const level = new LoggerLevel({ infix: "WARN" });
		expect(level.infix).toBe("WARN");
	});

	test("Message (Style function)", () => {
		const level = new LoggerLevel({ message: yellow });
		expect(level.message).not.toBeNull();
		expect(level.message!.style).toBe(yellow);
	});

	test("Message (Enum)", () => {
		const level = new LoggerLevel({
			message: { text: LoggerStyleText.Yellow },
		});
		expect(level.message).not.toBeNull();
		expect(level.message!.style).toBe(yellow);
	});

	test("Message (None)", () => {
		const level = new LoggerLevel({ message: null });
		expect(level.message).toBeNull();
	});

	test("Timestamp (Style function)", () => {
		const level = new LoggerLevel({ timestamp: { color: yellow } });
		expect(level.timestamp).not.toBeNull();
		expect(level.timestamp!.color).not.toBeNull();
		expect(level.timestamp!.color!.style).toBe(yellow);
	});

	test("Timestamp (Enum)", () => {
		const level = new LoggerLevel({
			timestamp: { color: { text: LoggerStyleText.Yellow } },
		});
		expect(level.timestamp).not.toBeNull();
		expect(level.timestamp!.color).not.toBeNull();
		expect(level.timestamp!.color!.style).toBe(yellow);
	});

	test("Timestamp (None)", () => {
		const level = new LoggerLevel({ timestamp: null });
		expect(level.timestamp).toBeNull();
	});
});
