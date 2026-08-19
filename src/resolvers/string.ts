import type { ResolverBoundsOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Passes a parameter through unchanged once its length falls inside the requested bounds.
 *
 * Length is counted in UTF-16 code units, matching `String.prototype.length`, so an emoji or any
 * other astral character counts as more than one.
 *
 * @param parameter The raw text to check.
 * @param options The shortest and longest lengths accepted.
 * @returns The parameter, or `stringTooShort` or `stringTooLong`.
 *
 * @since 1.0.0
 */
export function resolveString(
	parameter: string,
	options?: ResolverBoundsOptions,
): Result<
	string,
	| typeof Identifiers.ArgumentStringTooShort
	| typeof Identifiers.ArgumentStringTooLong
> {
	if (
		typeof options?.minimum === "number" &&
		parameter.length < options.minimum
	) {
		return err(Identifiers.ArgumentStringTooShort);
	}

	if (
		typeof options?.maximum === "number" &&
		parameter.length > options.maximum
	) {
		return err(Identifiers.ArgumentStringTooLong);
	}

	return ok(parameter);
}
