import type { BooleanResolverOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * The words that always resolve to `true`, whatever else the caller chooses to accept.
 */
const affirmatives = ["1", "true", "+", "t", "yes", "y"] as const;

/**
 * The words that always resolve to `false`, whatever else the caller chooses to accept.
 */
const negatives = ["0", "false", "-", "f", "no", "n"] as const;

/**
 * Reads a parameter as a boolean, accepting the handful of spellings people actually type rather
 * than only `true` and `false`.
 *
 * Comparison is case-insensitive, and anything supplied through `customs` is checked alongside the
 * built-in words instead of replacing them.
 *
 * @param parameter The raw text to interpret.
 * @param customs Extra spellings to accept for either outcome.
 * @returns The boolean, or `booleanError` when the text matches nothing.
 *
 * @since 1.0.0
 */
export function resolveBoolean(
	parameter: string,
	customs?: BooleanResolverOptions,
): Result<boolean, typeof Identifiers.ArgumentBooleanError> {
	const normalized = parameter.toLowerCase();

	if ([...affirmatives, ...(customs?.truths ?? [])].includes(normalized)) {
		return ok(true);
	}

	if ([...negatives, ...(customs?.falses ?? [])].includes(normalized)) {
		return ok(false);
	}

	return err(Identifiers.ArgumentBooleanError);
}
