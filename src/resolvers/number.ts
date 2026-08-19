import type { ResolverBoundsOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Reads a parameter as a number, whole or fractional.
 *
 * @param parameter The raw text to interpret.
 * @param options The smallest and largest values accepted.
 * @returns The number, or `numberError`, `numberTooSmall` or `numberTooLarge` depending on what
 * failed.
 *
 * @since 1.0.0
 */
export function resolveNumber(
	parameter: string,
	options?: ResolverBoundsOptions,
): Result<
	number,
	| typeof Identifiers.ArgumentNumberError
	| typeof Identifiers.ArgumentNumberTooSmall
	| typeof Identifiers.ArgumentNumberTooLarge
> {
	const parsed = Number(parameter);

	if (Number.isNaN(parsed)) {
		return err(Identifiers.ArgumentNumberError);
	}

	if (typeof options?.minimum === "number" && parsed < options.minimum) {
		return err(Identifiers.ArgumentNumberTooSmall);
	}

	if (typeof options?.maximum === "number" && parsed > options.maximum) {
		return err(Identifiers.ArgumentNumberTooLarge);
	}

	return ok(parsed);
}
