import type { ResolverBoundsOptions } from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { type Result, err, ok } from "@utilities/result/index.ts";

/**
 * Reads a parameter as a date, understanding every format the `Date` constructor does.
 *
 * The bounds, when given, are millisecond timestamps compared against the parsed date.
 *
 * @param parameter The raw text to interpret.
 * @param options The earliest and latest timestamps the date may fall on.
 * @returns The date, or `dateError`, `dateTooEarly` or `dateTooFar` depending on what failed.
 *
 * @since 1.0.0
 */
export function resolveDate(
	parameter: string,
	options?: ResolverBoundsOptions,
): Result<
	Date,
	| typeof Identifiers.ArgumentDateError
	| typeof Identifiers.ArgumentDateTooEarly
	| typeof Identifiers.ArgumentDateTooFar
> {
	const parsed = new Date(parameter);
	const time = parsed.getTime();

	if (Number.isNaN(time)) {
		return err(Identifiers.ArgumentDateError);
	}

	if (typeof options?.minimum === "number" && time < options.minimum) {
		return err(Identifiers.ArgumentDateTooEarly);
	}

	if (typeof options?.maximum === "number" && time > options.maximum) {
		return err(Identifiers.ArgumentDateTooFar);
	}

	return ok(parsed);
}
