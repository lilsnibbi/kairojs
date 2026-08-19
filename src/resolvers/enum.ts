import type { EnumResolverOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Checks a parameter against a fixed list of permitted values and hands it straight back when it
 * is one of them.
 *
 * The text is returned exactly as it was typed, even under `caseInsensitive`, so a caller that
 * needs the canonical spelling has to look it up in its own list.
 *
 * @param parameter The raw text to check.
 * @param options The permitted values, and whether casing is ignored.
 * @returns The parameter, `enumEmptyError` when no values were supplied at all, or `enumError`
 * when it matches none of them.
 *
 * @since 1.0.0
 */
export function resolveEnum(
	parameter: string,
	options?: EnumResolverOptions,
): Result<
	string,
	| typeof Identifiers.ArgumentEnumEmptyError
	| typeof Identifiers.ArgumentEnumError
> {
	if (!options?.enum?.length) {
		return err(Identifiers.ArgumentEnumEmptyError);
	}

	if (!options.caseInsensitive && !options.enum.includes(parameter)) {
		return err(Identifiers.ArgumentEnumError);
	}

	if (
		options.caseInsensitive &&
		!options.enum.some(
			(candidate) => candidate.toLowerCase() === parameter.toLowerCase(),
		)
	) {
		return err(Identifiers.ArgumentEnumError);
	}

	return ok(parameter);
}
