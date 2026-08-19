import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { BucketScope } from "@/constants/enums.ts";
import { container } from "@/container.ts";
import { parseConstructorPreConditionsCooldown } from "@/precondition-resolvers/cooldown.ts";
import { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";
import type { PreconditionContainerSingle } from "@/preconditions-container/container-single.ts";

// The upstream suite reached for `vi.mock` to replace the module that owned `container`. Bun has no
// drop-in for that here and none is needed: `container` is a plain mutable service bag, so the
// client-wide defaults can simply be written onto it and put back afterwards.
const originalClient = container.client;

beforeAll(() => {
	container.client = {
		options: {
			defaultCooldown: {
				limit: 1,
				delay: 2,
				scope: BucketScope.User,
				filteredCommands: undefined,
				filteredUsers: undefined,
			},
		},
	} as never;
});

afterAll(() => {
	container.client = originalClient;
});

describe("parseConstructorPreConditionsCooldown", () => {
	test("GIVEN no limit and no delay THEN falls back to the client defaults", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsCooldown(
			{ name: "test" } as never,
			undefined,
			undefined,
			undefined,
			undefined,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe("Cooldown");
		expect(entry.context).toMatchObject({
			scope: BucketScope.User,
			limit: 1,
			delay: 2,
			filteredUsers: undefined,
		});
	});

	test("GIVEN a limit and a delay THEN uses the passed values", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsCooldown(
			{ name: "test" } as never,
			5,
			10,
			undefined,
			undefined,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe("Cooldown");
		expect(entry.context).toMatchObject({
			scope: BucketScope.User,
			limit: 5,
			delay: 10,
			filteredUsers: undefined,
		});
	});

	test("GIVEN a scope, filtered users, a limit and a delay THEN uses all of the passed values", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsCooldown(
			{ name: "test" } as never,
			5,
			10,
			BucketScope.Guild,
			["user1", "user2"],
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe("Cooldown");
		expect(entry.context).toMatchObject({
			scope: BucketScope.Guild,
			limit: 5,
			delay: 10,
			filteredUsers: ["user1", "user2"],
		});
	});
});
