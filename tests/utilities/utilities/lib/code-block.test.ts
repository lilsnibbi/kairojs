import { describe, expect, test } from "bun:test";
import { codeBlock } from "@utilities/utilities/index.ts";

const zeroWidthSpace = String.fromCharCode(8203);

// Written with explicit `\n`/`\t` escapes so the exact whitespace under test survives formatting.
const innerCodeBlockInput =
	"\n\t\t\t# Header\n\t\t\t```js\n\t\t\t\tif (kairoCommunityIsCool) return 'awesome!';\n\t\t\t```\n\t\t";
const innerCodeBlockExpected =
	"```md\n" +
	`\n\t\t\t# Header\n\t\t\t\`${zeroWidthSpace}\`\`js\n\t\t\t\tif (kairoCommunityIsCool) return 'awesome!';\n\t\t\t\`\`\`\n\t\t` +
	"\n```";

const inlineCodeBlockInput =
	"\n\t\t\t# Header\n\t\t\t`const kairoCommunityIsCool = true`\n\t\t";
const inlineCodeBlockExpected = `\`\`\`md\n${inlineCodeBlockInput}\n\`\`\``;

describe("codeBlock", () => {
	test("GIVEN expression w/o length THEN returns wrapped ZeroWidthSpace", () => {
		expect(codeBlock("md", "")).toStrictEqual("```md\n\n```");
	});

	test("GIVEN expression w/ length THEN returns expressed wrapped in markdown", () => {
		expect(codeBlock("md", "# Header")).toStrictEqual("```md\n# Header\n```");
	});

	test("GIVEN expression w/ length w/ inner code block THEN returns expressed wrapped in markdown", () => {
		expect(codeBlock("md", innerCodeBlockInput) as unknown).toStrictEqual(
			innerCodeBlockExpected,
		);
	});

	test("GIVEN expression w/ length w/ inner inline code block THEN returns expressed wrapped in markdown", () => {
		expect(codeBlock("md", inlineCodeBlockInput) as unknown).toStrictEqual(
			inlineCodeBlockExpected,
		);
	});

	test("GIVEN expression of non-string type THEN returns wrapped expression", () => {
		// @ts-expect-error Checking for invalid input
		expect(codeBlock("md", 123456789)).toStrictEqual("```md\n123456789\n```");
	});

	test("GIVEN expression of falsey type THEN returns wrapped expression", () => {
		// @ts-expect-error Checking for invalid input
		expect(codeBlock("md", false)).toStrictEqual("```md\nfalse\n```");
	});
});
