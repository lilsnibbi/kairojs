import { describe, expect, test } from "bun:test";
import { regExpEsc } from "@utilities/common/index.ts";

describe("regExpEsc", () => {
	test("GIVEN hyphen THEN returns expected", () => {
		const source = "test-this";
		const expected = String.raw`test\-this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN slash THEN returns expected", () => {
		const source = "test/this";
		const expected = String.raw`test\/this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN back slash THEN returns expected", () => {
		const source = String.raw`test\this`;
		const expected = String.raw`test\\this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN caret THEN returns expected", () => {
		const source = "^test";
		const expected = String.raw`\^test`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN dollar THEN returns expected", () => {
		const source = "test$";
		const expected = String.raw`test\$`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN * quantifier THEN returns expected", () => {
		const source = "test*this";
		const expected = String.raw`test\*this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN + quantifier THEN returns expected", () => {
		const source = "test+this";
		const expected = String.raw`test\+this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN ? quantifier THEN returns expected", () => {
		const source = "test?this";
		const expected = String.raw`test\?this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN . quantifier THEN returns expected", () => {
		const source = "t.this";
		const expected = String.raw`t\.this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN parentheses THEN returns expected", () => {
		const source = "(t)";
		const expected = String.raw`\(t\)`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN vertical bar THEN returns expected", () => {
		const source = "test|this";
		const expected = String.raw`test\|this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN brackets THEN returns expected", () => {
		const source = "[test]";
		const expected = String.raw`\[test\]`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN curly brackets THEN returns expected", () => {
		const source = "{test}";
		const expected = String.raw`\{test\}`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test("GIVEN combined THEN returns expected", () => {
		const source = "^(he?l*l+.)|[wW]o{,2}rld$";
		const expected = String.raw`\^\(he\?l\*l\+\.\)\|\[wW\]o\{,2\}rld\$`;
		expect(regExpEsc(source)).toBe(expected);
	});
});
