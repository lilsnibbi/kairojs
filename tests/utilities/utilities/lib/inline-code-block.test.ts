import { describe, expect, test } from "bun:test";
import { inlineCodeBlock } from "@utilities/utilities/index.ts";

// `inlineCodeBlock` swaps every regular space for a non-breaking space, spelled out as an escape
// here so the distinction between the two survives editing.
const nonBreakingSpace = " ";

describe("inlineCodeblock", () => {
	test("GIVEN text THEN converts to inline codeblock", () => {
		const expected = `\`const${nonBreakingSpace}kairoCommunityIsCool${nonBreakingSpace}=${nonBreakingSpace}true\``;
		expect(
			inlineCodeBlock("const kairoCommunityIsCool = true") as unknown,
		).toEqual(expected);
	});
});
