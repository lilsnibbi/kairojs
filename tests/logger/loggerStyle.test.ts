import { describe, expect, test } from "bun:test";
import {
	LoggerStyleBackground,
	LoggerStyleEffect,
	LoggerStyleText,
	colors,
} from "@/logger/colors.ts";
import { LoggerStyle } from "@/logger/logger.ts";
import { isClass } from "@utilities/common/index.ts";

// The upstream suite compared against `colorette`. Kairo has no third-party dependencies, so the
// same styling functions come from the framework's own `colors` table.
const { bgCyan, bold, dim, green, inverse, reset } = colors;

describe("LoggerStyle", () => {
	test("LoggerStyle should be a class", () => {
		expect(isClass(LoggerStyle)).toBe(true);
	});

	test("Empty Constructor", () => {
		const style = new LoggerStyle();
		expect(style.style).toBe(reset);
	});

	test("Empty Object Constructor", () => {
		const style = new LoggerStyle({});
		expect(style.style).toBe(reset);
	});

	test("Background", () => {
		const style = new LoggerStyle({ background: LoggerStyleBackground.Cyan });
		expect(style.run("World")).toBe(bgCyan("World"));
	});

	test("Text", () => {
		const style = new LoggerStyle({ text: LoggerStyleText.Green });
		expect(style.run("World")).toBe(green("World"));
	});

	test("Effect", () => {
		const style = new LoggerStyle({ effects: [LoggerStyleEffect.Inverse] });
		expect(style.run("World")).toBe(inverse("World"));
	});

	test("Effects", () => {
		const style = new LoggerStyle({
			effects: [LoggerStyleEffect.Dim, LoggerStyleEffect.Bold],
		});
		expect(style.run("World")).toBe(bold(dim("World")));
	});

	test("Multiple", () => {
		const style = new LoggerStyle({
			background: LoggerStyleBackground.Cyan,
			text: LoggerStyleText.Green,
			effects: [LoggerStyleEffect.Dim, LoggerStyleEffect.Bold],
		});
		expect(style.run("World")).toBe(bgCyan(green(bold(dim("World")))));
	});
});
