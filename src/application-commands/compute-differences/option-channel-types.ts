import type {
	AllowedApplicationCommandChannelType,
	CommandDifference,
	OptionChannelTypesDifferenceOptions,
} from "@types";
import { ChannelType } from "discord.js";

/**
 * Readable names for the channel types an option may accept. The raw number is kept in the text
 * because it is what shows up in the API payload a reader may be comparing against.
 */
const channelTypeToPrettyName: Record<
	AllowedApplicationCommandChannelType,
	string
> = {
	[ChannelType.GuildText]: "text channel (type 0)",
	[ChannelType.GuildVoice]: "voice channel (type 2)",
	[ChannelType.GuildCategory]: "guild category (type 4)",
	[ChannelType.GuildAnnouncement]: "guild announcement channel (type 5)",
	[ChannelType.AnnouncementThread]: "guild announcement thread (type 10)",
	[ChannelType.PublicThread]: "guild public thread (type 11)",
	[ChannelType.PrivateThread]: "guild private thread (type 12)",
	[ChannelType.GuildStageVoice]: "guild stage voice channel (type 13)",
	[ChannelType.GuildForum]: "guild forum (type 15)",
	[ChannelType.GuildMedia]: "guild media channel (type 16)",
};

/**
 * Describes a channel type, falling back to a message that names the raw numeric type when Discord
 * has introduced one Kairo does not know about yet.
 *
 * @param type The channel type to describe.
 */
function describeChannelType(
	type: AllowedApplicationCommandChannelType,
): string {
	return (
		channelTypeToPrettyName[type] ??
		`unknown channel type (${type}); please report this to the Kairo developers!`
	);
}

/**
 * Compares which channel types a channel option accepts.
 *
 * Discord stores the list in the order it was sent, so a reordering counts as a change and is
 * reported entry by entry rather than as a single wholesale mismatch.
 *
 * @param options The lists to compare, plus where the option sits in the command.
 * @yields One difference per position that does not line up.
 *
 * @since 1.0.0
 */
export function* checkChannelTypes({
	existingChannelTypes,
	newChannelTypes,
	currentIndex,
	keyPath,
}: OptionChannelTypesDifferenceOptions): Generator<CommandDifference> {
	// 0. Nothing was restricted before and something is now.
	if (!existingChannelTypes?.length && newChannelTypes?.length) {
		yield {
			key: `${keyPath(currentIndex)}.channel_types`,
			original: "no channel types present",
			expected: "channel types present",
		};
	}
	// 1. Something was restricted before and nothing is now.
	else if (existingChannelTypes?.length && !newChannelTypes?.length) {
		yield {
			key: `${keyPath(currentIndex)}.channel_types`,
			original: "channel types present",
			expected: "no channel types present",
		};
	}
	// 2. Both sides have entries, so walk them position by position.
	else if (newChannelTypes?.length) {
		let index = 0;

		for (const channelType of newChannelTypes) {
			const currentChannelTypeIndex = index++;
			const existingChannelType =
				existingChannelTypes![currentChannelTypeIndex];

			if (channelType !== existingChannelType) {
				yield {
					key: `${keyPath(currentChannelTypeIndex)}.channel_types[${currentChannelTypeIndex}]`,
					original:
						existingChannelType === undefined
							? "no channel type present"
							: describeChannelType(existingChannelType),
					expected: describeChannelType(channelType),
				};
			}
		}

		// Anything left over used to be accepted and no longer is.
		if (existingChannelTypes && index < existingChannelTypes.length) {
			for (; index < existingChannelTypes.length; index++) {
				const channelType = existingChannelTypes[
					index
				] as AllowedApplicationCommandChannelType;
				yield {
					key: `${keyPath(index)}.channel_types[${index}]`,
					expected: "no channel type present",
					original: describeChannelType(channelType),
				};
			}
		}
	}
}
