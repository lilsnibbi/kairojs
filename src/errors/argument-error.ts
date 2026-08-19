import type { ArgumentErrorOptions } from "@types";
import type { Argument } from "@/structures/argument.ts";
import { UserError } from "./user-error.ts";

/**
 * Raised when an {@link Argument} could not turn a parameter into the value it promises.
 *
 * Carries both the argument that failed and the raw text it was given, so a handler can explain
 * precisely which word was rejected.
 *
 * @since 1.0.0
 */
export class ArgumentError<T = unknown> extends UserError {
	/**
	 * The argument that rejected the parameter.
	 */
	public readonly argument: Argument<T>;

	/**
	 * The raw text that could not be parsed.
	 */
	public readonly parameter: string;

	/**
	 * @param options The failing argument, the parameter it rejected, and the usual error details.
	 */
	public constructor(options: ArgumentErrorOptions<T>) {
		super({
			...options,
			identifier: options.identifier ?? options.argument.name,
		});
		this.argument = options.argument;
		this.parameter = options.parameter;
	}

	public override get name(): string {
		return "ArgumentError";
	}
}
