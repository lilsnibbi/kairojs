import type { CommandRunInUnion, CommandSpecificRunIn } from "@types";
import type { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";
import type { ChannelType } from "discord.js";
import { CommandPreConditions } from "@/constants/enums.ts";
import { Command } from "@/structures/command.ts";
import { isNullOrUndefined } from "@utilities/utilities/index.ts";

/**
 * Attaches the `RunIn` precondition, which confines a command to a set of channel types.
 *
 * A command may state one set for every entry point or a different set per entry point, and either
 * form may resolve to nothing at all — an omitted `runIn` means "anywhere", and adding a
 * precondition for that would only cost time at dispatch. Nothing is appended in that case.
 *
 * @param runIn The command's `runIn` option, as written in its constructor.
 * @param resolveConstructorPreConditionsRunType Turns one `runIn` value into the channel types it
 * stands for, or `null` when it constrains nothing.
 * @param preconditionContainerArray The command's precondition list to append to.
 *
 * @since 1.0.0
 */
export function parseConstructorPreConditionsRunIn(
	runIn: CommandRunInUnion | CommandSpecificRunIn,
	resolveConstructorPreConditionsRunType: (
		types: CommandRunInUnion,
	) => readonly ChannelType[] | null,
	preconditionContainerArray: PreconditionContainerArray,
) {
	if (isNullOrUndefined(runIn)) return;

	if (Command.runInTypeIsSpecificsObject(runIn)) {
		const messageRunTypes = resolveConstructorPreConditionsRunType(
			runIn.messageRun,
		);
		const chatInputRunTypes = resolveConstructorPreConditionsRunType(
			runIn.chatInputRun,
		);
		const contextMenuRunTypes = resolveConstructorPreConditionsRunType(
			runIn.contextMenuRun,
		);

		if (
			messageRunTypes !== null ||
			chatInputRunTypes !== null ||
			contextMenuRunTypes !== null
		) {
			preconditionContainerArray.append({
				name: CommandPreConditions.RunIn,
				context: {
					types: {
						messageRun: messageRunTypes ?? [],
						chatInputRun: chatInputRunTypes ?? [],
						contextMenuRun: contextMenuRunTypes ?? [],
					},
				},
			});
		}

		return;
	}

	const types = resolveConstructorPreConditionsRunType(runIn);
	if (types !== null) {
		preconditionContainerArray.append({
			name: CommandPreConditions.RunIn,
			context: { types },
		});
	}
}
