import { describe, expect, test } from "bun:test";
import { PermissionFlagsBits, type PermissionsBitField } from "discord.js";
import { CommandPreConditions } from "@/constants/enums.ts";
import { parseConstructorPreConditionsRequiredClientPermissions } from "@/preconditions/resolvers/clientPermissions.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import type { PreconditionContainerSingle } from "@/preconditions/containers/containerSingle.ts";

describe("parseConstructorPreConditionsRequiredClientPermissions", () => {
	test("GIVEN valid permissions THEN appends to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRequiredClientPermissions(
			PermissionFlagsBits.Administrator,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe(CommandPreConditions.ClientPermissions);
		expect(
			(entry.context.permissions as PermissionsBitField | undefined)?.has(
				PermissionFlagsBits.Administrator,
			),
		).toBe(true);
	});

	test("GIVEN no permissions THEN does not append to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRequiredClientPermissions(
			undefined,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(0);
	});
});
