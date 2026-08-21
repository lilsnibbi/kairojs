import { describe, expect, test } from "bun:test";
import { PermissionFlagsBits, type PermissionsBitField } from "discord.js";
import { CommandPreConditions } from "@/constants/enums.ts";
import { parseConstructorPreConditionsRequiredUserPermissions } from "@/preconditions/resolvers/userPermissions.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import type { PreconditionContainerSingle } from "@/preconditions/containers/containerSingle.ts";

describe("parseConstructorPreConditionsRequiredUserPermissions", () => {
	test("GIVEN valid permissions THEN appends to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRequiredUserPermissions(
			PermissionFlagsBits.Administrator,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe(CommandPreConditions.UserPermissions);
		expect(
			(entry.context.permissions as PermissionsBitField | undefined)?.has(
				PermissionFlagsBits.Administrator,
			),
		).toBe(true);
	});

	test("GIVEN no permissions THEN does not append to the precondition container array", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRequiredUserPermissions(
			undefined,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(0);
	});
});
