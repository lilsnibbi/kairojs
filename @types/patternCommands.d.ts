import type { Message } from "discord.js";
import type { PatternCommandEvents as PatternCommandEventsConstant } from "@/constants/patternCommands.ts";
import type { UserError } from "@/errors/userError.ts";
import type { PatternCommand } from "@/structures/patternCommand.ts";
import type { CommandOptions, MessageCommandRunContext } from "./commands.d.ts";

/**
 * Every event a pattern command passes through, from scan to completion.
 *
 * @since 1.0.0
 */
export type PatternCommandEvents =
	(typeof PatternCommandEventsConstant)[keyof typeof PatternCommandEventsConstant];

/**
 * The options a `PatternCommand` is constructed with.
 *
 * @since 1.0.0
 */
export interface PatternCommandOptions extends CommandOptions {
	/**
	 * The percentage chance, from 1 to 100, that a matched command actually runs.
	 *
	 * Anything below 100 makes the command occasional rather than reliable, which is the point for
	 * a joke response that would wear thin if it fired every time.
	 *
	 * @default 100
	 */
	chance?: number;

	/**
	 * How strongly this command claims a message when several match it, from 0 to 10. The heaviest
	 * match is tried first; values outside the range are clamped.
	 *
	 * @default 5
	 */
	weight?: number;

	/**
	 * Whether the command's name has to match a whole word rather than appearing anywhere in the
	 * message, so `lore` no longer matches "explore".
	 *
	 * This applies to the command's name only; its aliases are always matched loosely.
	 *
	 * @default false
	 */
	matchFullName?: boolean;
}

/**
 * One command that matched an incoming message, kept alongside the alias that matched it so the
 * selection can be sorted and reported.
 *
 * @since 1.0.0
 */
export interface PossiblePatternCommand {
	command: PatternCommand;
	alias: string;
	weight: number;
}

/**
 * What the scan reports: the message, and every command it matched in descending weight order.
 *
 * @since 1.0.0
 */
export interface PatternCommandPrePayload {
	message: Message;
	possibleCommands: PossiblePatternCommand[];
}

/**
 * The smallest payload a pattern command event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandPayload {
	/**
	 * The message that matched.
	 */
	message: Message;

	/**
	 * The command the message matched.
	 */
	command: PatternCommand;

	/**
	 * The name or alias that did the matching.
	 */
	alias: string;
}

/**
 * What the denial event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandDeniedPayload extends PatternCommandPayload {
	parameters: string;
	context: MessageCommandRunContext;
}

/**
 * What the pre-run event carries.
 *
 * @since 1.0.0
 */
export interface PatternPreCommandRunPayload
	extends PatternCommandDeniedPayload {}

/**
 * What the acceptance event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandAcceptedPayload extends PatternCommandPayload {
	parameters: string;
	context: MessageCommandRunContext;
}

/**
 * What the completion event carries, however the run turned out.
 *
 * @since 1.0.0
 */
export interface PatternCommandFinishedPayload
	extends PatternCommandAcceptedPayload {
	duration: number;
	success: boolean;
}

/**
 * What the success event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandSuccessPayload
	extends PatternCommandFinishedPayload {
	result: unknown;
}

/**
 * What the error event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandErrorPayload
	extends PatternCommandFinishedPayload {}

/**
 * What the lost-chance-roll event carries.
 *
 * @since 1.0.0
 */
export interface PatternCommandNoLuckPayload
	extends PatternCommandAcceptedPayload {}

declare module "discord.js" {
	interface ClientEvents {
		[PatternCommandEventsConstant.PreCommandRun]: [
			payload: PatternCommandPrePayload,
		];
		[PatternCommandEventsConstant.CommandDenied]: [
			error: UserError,
			payload: PatternCommandPayload,
		];
		[PatternCommandEventsConstant.CommandNoLuck]: [
			payload: PatternCommandPayload,
		];
		[PatternCommandEventsConstant.CommandAccepted]: [
			payload: PatternCommandPayload,
		];
		[PatternCommandEventsConstant.CommandRun]: [
			message: Message,
			command: PatternCommand,
			payload: PatternCommandAcceptedPayload,
		];
		// The success and error events are emitted without a `success` flag — that only becomes known
		// once the run has settled, and it is reported on the finished event instead.
		[PatternCommandEventsConstant.CommandSuccess]: [
			payload: Omit<PatternCommandSuccessPayload, "success">,
		];
		[PatternCommandEventsConstant.CommandError]: [
			error: unknown,
			payload: Omit<PatternCommandErrorPayload, "success">,
		];
		[PatternCommandEventsConstant.CommandFinished]: [
			message: Message,
			command: PatternCommand,
			payload: PatternCommandFinishedPayload,
		];
	}
}
