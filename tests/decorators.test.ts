import { describe, expect, test } from "bun:test";
import {
	Enumerable,
	EnumerableMethod,
	createFunctionPrecondition,
} from "@utilities/decorators/index.ts";

/**
 * Applies the decorators the way a bot author would — as `@decorator` syntax rather than direct
 * calls — because that is the only thing that exercises `experimentalDecorators`. Under TC39
 * semantics `Enumerable` cannot work at all, so this suite is what proves the compiler flag is set
 * correctly rather than merely present.
 */
describe("decorators", () => {
	test("Enumerable(false) hides a field from spreads while keeping it readable", () => {
		class Example {
			@Enumerable(false)
			public hidden = "secret";

			public shown = "visible";
		}

		const instance = new Example();

		expect(instance.hidden).toBe("secret");
		expect(Object.keys(instance)).toEqual(["shown"]);
		expect({ ...instance }).toEqual({ shown: "visible" } as never);
	});

	test("Enumerable(true) leaves a field enumerable", () => {
		class Example {
			@Enumerable(true)
			public visible = 1;
		}

		expect(Object.keys(new Example())).toEqual(["visible"]);
	});

	test("EnumerableMethod(true) exposes a prototype method", () => {
		class Example {
			@EnumerableMethod(true)
			public method() {
				return 1;
			}
		}

		expect(Object.keys(Example.prototype)).toContain("method");
	});

	test("a function precondition runs the method when it passes", async () => {
		const allow = createFunctionPrecondition(() => true);

		class Example {
			@allow
			public run(value: number) {
				return value * 2;
			}
		}

		expect(await new Example().run(21)).toBe(42);
	});

	test("a function precondition falls back when it fails, without running the method", async () => {
		let ran = false;
		const deny = createFunctionPrecondition(
			() => false,
			() => "denied",
		);

		class Example {
			@deny
			public run() {
				ran = true;
				return "ran";
			}
		}

		expect(await new Example().run()).toBe("denied");
		expect(ran).toBe(false);
	});

	test("a function precondition receives the call's arguments and `this`", async () => {
		const seen: unknown[] = [];
		const record = createFunctionPrecondition((...args: unknown[]) => {
			seen.push(...args);
			return true;
		});

		class Example {
			public label = "example";

			@record
			public run(a: number, b: string) {
				return `${this.label}:${a}${b}`;
			}
		}

		expect(await new Example().run(1, "x")).toBe("example:1x");
		expect(seen).toEqual([1, "x"]);
	});
});
