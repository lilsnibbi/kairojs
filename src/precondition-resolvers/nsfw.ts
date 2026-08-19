import type { PreconditionContainerArray } from "@/preconditions-container/container-array.ts";
import { CommandPreConditions } from "@/constants/enums.ts";

/**
 * Attaches the `NSFW` precondition to a command that marks itself as age-restricted, confining it
 * to channels flagged for that content.
 *
 * @param nsfw Whether the command declared itself age-restricted.
 * @param preconditionContainerArray The command's precondition list to append to.
 *
 * @since 1.0.0
 */
export function parseConstructorPreConditionsNsfw(
	nsfw: boolean | undefined,
	preconditionContainerArray: PreconditionContainerArray,
) {
	if (nsfw)
		preconditionContainerArray.append(CommandPreConditions.NotSafeForWork);
}
