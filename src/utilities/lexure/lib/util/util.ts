import type { Parameter } from "@types";

/**
 * Joins the given parameters back into a single string, placing each parameter's `leading`
 * separator text between it and the one before it, and using each parameter's `value`.
 *
 * @see {@link joinRaw} for the variant that uses `raw` instead of `value`, preserving quotes.
 *
 * @param parameters The parameters to join.
 * @returns The joined string.
 *
 * @since 1.0.0
 */
export function join(parameters: readonly Parameter[]): string {
	if (parameters.length === 0) return "";
	if (parameters.length === 1) return parameters[0].value;

	let output = parameters[0].value;
	for (let index = 1; index < parameters.length; index++) {
		const parameter = parameters[index];
		output += parameter.leading + parameter.value;
	}

	return output;
}

/**
 * Joins the given parameters back into a single string, placing each parameter's `leading`
 * separator text between it and the one before it, and using each parameter's `raw`.
 *
 * @see {@link join} for the variant that uses `value` instead of `raw`, discarding quotes.
 *
 * @param parameters The parameters to join.
 * @returns The joined string.
 *
 * @since 1.0.0
 */
export function joinRaw(parameters: readonly Parameter[]): string {
	if (parameters.length === 0) return "";
	if (parameters.length === 1) return parameters[0].raw;

	let output = parameters[0].raw;
	for (let index = 1; index < parameters.length; index++) {
		const parameter = parameters[index];
		output += parameter.leading + parameter.raw;
	}

	return output;
}
