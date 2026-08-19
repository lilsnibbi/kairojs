import type { ResolverBoundsOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Reads a parameter as a whole number, rejecting anything with a fractional part outright rather
 * than rounding it away.
 *
 * @param parameter The raw text to interpret.
 * @param options The smallest and largest values accepted.
 * @returns The integer, or `integerError`, `integerTooSmall` or `integerTooLarge` depending on
 * what failed.
 *
 * @since 1.0.0
 */
export function resolveInteger(
	parameter: string,
	options?: ResolverBoundsOptions,
): Result<
	number,
	| typeof Identifiers.ArgumentIntegerError
	| typeof Identifiers.ArgumentIntegerTooSmall
	| typeof Identifiers.ArgumentIntegerTooLarge
> {
	const parsed = Number(parameter);

	if (!Number.isInteger(parsed)) {
		return err(Identifiers.ArgumentIntegerError);
	}

	if (typeof options?.minimum === "number" && parsed < options.minimum) {
		return err(Identifiers.ArgumentIntegerTooSmall);
	}

	if (typeof options?.maximum === "number" && parsed > options.maximum) {
		return err(Identifiers.ArgumentIntegerTooLarge);
	}

	return ok(parsed);
}
