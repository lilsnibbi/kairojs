import type { PreconditionCondition } from "@types";
import { Result } from "@utilities/result/index.ts";

/**
 * The operator that requires every child to pass, the equivalent of `first && second && third`.
 *
 * The sequential form stops at the first refusal, so a child that is expensive to evaluate never
 * runs once an earlier one has already denied the command. The parallel form starts everything at
 * once and then reports the first refusal in declaration order, which keeps the message a user sees
 * stable no matter which child happened to settle first.
 *
 * @since 1.0.0
 */
export const PreconditionConditionAnd: PreconditionCondition = {
	async messageSequential(message, command, entries, context) {
		for (const child of entries) {
			const result = await child.messageRun(message, command, context);
			if (result.isErr()) return result;
		}

		return Result.ok();
	},
	async messageParallel(message, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) => entry.messageRun(message, command, context)),
		);
		return results.find((result) => result.isErr()) ?? Result.ok();
	},
	async chatInputSequential(interaction, command, entries, context) {
		for (const child of entries) {
			const result = await child.chatInputRun(interaction, command, context);
			if (result.isErr()) return result;
		}

		return Result.ok();
	},
	async chatInputParallel(interaction, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) => entry.chatInputRun(interaction, command, context)),
		);
		return results.find((result) => result.isErr()) ?? Result.ok();
	},
	async contextMenuSequential(interaction, command, entries, context) {
		for (const child of entries) {
			const result = await child.contextMenuRun(interaction, command, context);
			if (result.isErr()) return result;
		}

		return Result.ok();
	},
	async contextMenuParallel(interaction, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) =>
				entry.contextMenuRun(interaction, command, context),
			),
		);
		return results.find((result) => result.isErr()) ?? Result.ok();
	},
};
