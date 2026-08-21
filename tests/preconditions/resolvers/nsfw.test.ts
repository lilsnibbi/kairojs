import { describe, expect, test } from "bun:test";
import { CommandPreConditions } from "@/constants/enums.ts";
import { parseConstructorPreConditionsNsfw } from "@/preconditions/resolvers/nsfw.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import type { PreconditionContainerSingle } from "@/preconditions/containers/containerSingle.ts";

describe("parseConstructorPreConditionsNsfw", () => {
	test("GIVEN nsfw true THEN appends to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsNsfw(true, preconditionContainerArray);

		expect(preconditionContainerArray.entries.length).toBe(1);
		expect(
			(preconditionContainerArray.entries[0] as PreconditionContainerSingle)
				.name,
		).toBe(CommandPreConditions.NotSafeForWork);
	});

	test("GIVEN nsfw false THEN does not append to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsNsfw(false, preconditionContainerArray);

		expect(preconditionContainerArray.entries.length).toBe(0);
	});

	test("GIVEN nsfw undefined THEN does not append to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsNsfw(undefined, preconditionContainerArray);

		expect(preconditionContainerArray.entries.length).toBe(0);
	});
});
