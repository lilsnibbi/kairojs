import { describe, expect, test } from "bun:test";
import { ChannelType } from "discord.js";
import type { CommandRunInUnion } from "@types";
import { CommandPreConditions } from "@/constants/enums.ts";
import { parseConstructorPreConditionsRunIn } from "@/preconditions/resolvers/runIn.ts";
import { PreconditionContainerArray } from "@/preconditions/containers/containerArray.ts";
import type { PreconditionContainerSingle } from "@/preconditions/containers/containerSingle.ts";
import { isNullOrUndefined } from "@utilities/common/index.ts";

// A copy of the same logic that lives on the Command class, extracted here so the resolver can be
// driven directly without standing up a client.
const ChannelTypes = Object.values(ChannelType).filter(
	(type) => typeof type === "number",
) as readonly ChannelType[];
const GuildChannelTypes = ChannelTypes.filter(
	(type) => type !== ChannelType.DM && type !== ChannelType.GroupDM,
) as readonly ChannelType[];

function resolveConstructorPreConditionsRunType(
	types: CommandRunInUnion,
): readonly ChannelType[] | null {
	if (isNullOrUndefined(types)) return null;
	if (typeof types === "number") return [types];

	if (typeof types === "string") {
		switch (types) {
			case "DM":
				return [ChannelType.DM];
			case "GUILD_TEXT":
				return [ChannelType.GuildText];
			case "GUILD_VOICE":
				return [ChannelType.GuildVoice];
			case "GUILD_NEWS":
				return [ChannelType.GuildAnnouncement];
			case "GUILD_NEWS_THREAD":
				return [ChannelType.AnnouncementThread];
			case "GUILD_PUBLIC_THREAD":
				return [ChannelType.PublicThread];
			case "GUILD_PRIVATE_THREAD":
				return [ChannelType.PrivateThread];
			case "GUILD_ANY":
				return GuildChannelTypes;
			default:
				return null;
		}
	}

	// A command that can run nowhere is a mistake, not a configuration:
	if (types.length === 0) {
		throw new Error(`"runIn" was specified as an empty array.`);
	}

	if (types.length === 1) {
		return resolveConstructorPreConditionsRunType(types[0]!);
	}

	const resolved = new Set<ChannelType>();
	for (const typeResolvable of types) {
		for (const type of resolveConstructorPreConditionsRunType(typeResolvable) ??
			[])
			resolved.add(type);
	}

	// Everything resolved means nothing is constrained:
	if (resolved.size === ChannelTypes.length) return null;

	return [...resolved].sort((a, b) => a - b);
}

describe("parseConstructorPreConditionsRunIn", () => {
	test("GIVEN runIn is null THEN appends nothing", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRunIn(
			null,
			resolveConstructorPreConditionsRunType,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(0);
	});

	test("GIVEN runIn is a per-entry-point object THEN appends the correct types", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRunIn(
			{
				messageRun: ChannelType.GuildText,
				chatInputRun: ChannelType.DM,
				contextMenuRun: ChannelType.GuildForum,
			},
			resolveConstructorPreConditionsRunType,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe(CommandPreConditions.RunIn);
		expect(entry.context).toEqual({
			types: {
				messageRun: [ChannelType.GuildText],
				chatInputRun: [ChannelType.DM],
				contextMenuRun: [ChannelType.GuildForum],
			},
		});
	});

	test("GIVEN runIn is a single channel type THEN appends the correct types", () => {
		const preconditionContainerArray = new PreconditionContainerArray();
		parseConstructorPreConditionsRunIn(
			ChannelType.GuildVoice,
			resolveConstructorPreConditionsRunType,
			preconditionContainerArray,
		);

		expect(preconditionContainerArray.entries.length).toBe(1);

		const entry = preconditionContainerArray
			.entries[0] as PreconditionContainerSingle;
		expect(entry.name).toBe(CommandPreConditions.RunIn);
		expect(entry.context).toEqual({ types: [ChannelType.GuildVoice] });
	});
});
