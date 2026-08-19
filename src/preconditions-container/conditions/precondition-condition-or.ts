import type {
	PreconditionContainerResult,
	PreconditionCondition,
} from "@types";
import { Result } from "@utilities/result/index.ts";

/**
 * The operator that requires at least one child to pass, the equivalent of
 * `first || second || third`.
 *
 * The sequential form stops at the first child that passes. When every child refuses, the last
 * refusal is the one reported — the same value the equivalent JavaScript expression would evaluate
 * to. An empty list passes, since there is nothing to refuse.
 *
 * @since 1.0.0
 */
export const PreconditionConditionOr: PreconditionCondition = {
	async messageSequential(message, command, entries, context) {
		let error: PreconditionContainerResult | null = null;
		for (const child of entries) {
			const result = await child.messageRun(message, command, context);
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
	async messageParallel(message, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) => entry.messageRun(message, command, context)),
		);

		let error: PreconditionContainerResult | null = null;
		for (const result of results) {
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
	async chatInputSequential(interaction, command, entries, context) {
		let error: PreconditionContainerResult | null = null;
		for (const child of entries) {
			const result = await child.chatInputRun(interaction, command, context);
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
	async chatInputParallel(interaction, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) => entry.chatInputRun(interaction, command, context)),
		);

		let error: PreconditionContainerResult | null = null;
		for (const result of results) {
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
	async contextMenuSequential(interaction, command, entries, context) {
		let error: PreconditionContainerResult | null = null;
		for (const child of entries) {
			const result = await child.contextMenuRun(interaction, command, context);
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
	async contextMenuParallel(interaction, command, entries, context) {
		const results = await Promise.all(
			entries.map((entry) =>
				entry.contextMenuRun(interaction, command, context),
			),
		);

		let error: PreconditionContainerResult | null = null;
		for (const result of results) {
			if (result.isOk()) return result;
			error = result;
		}

		return error ?? Result.ok();
	},
};
