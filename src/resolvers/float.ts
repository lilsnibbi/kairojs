import type { ResolverBoundsOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Reads a parameter as a floating point number.
 *
 * The parse itself is identical to {@link resolveNumber}; only the identifiers differ, which lets
 * a bot word "that is not a decimal" differently from "that is not a number".
 *
 * @param parameter The raw text to interpret.
 * @param options The smallest and largest values accepted.
 * @returns The number, or `floatError`, `floatTooSmall` or `floatTooLarge` depending on what
 * failed.
 *
 * @since 1.0.0
 */
export function resolveFloat(
	parameter: string,
	options?: ResolverBoundsOptions,
): Result<
	number,
	| typeof Identifiers.ArgumentFloatError
	| typeof Identifiers.ArgumentFloatTooSmall
	| typeof Identifiers.ArgumentFloatTooLarge
> {
	const parsed = Number(parameter);

	if (Number.isNaN(parsed)) {
		return err(Identifiers.ArgumentFloatError);
	}

	if (typeof options?.minimum === "number" && parsed < options.minimum) {
		return err(Identifiers.ArgumentFloatTooSmall);
	}

	if (typeof options?.maximum === "number" && parsed > options.maximum) {
		return err(Identifiers.ArgumentFloatTooLarge);
	}

	return ok(parsed);
}
