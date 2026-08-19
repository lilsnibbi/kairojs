import type { Argument } from "@/structures/argument.ts";
import type { Precondition } from "@/structures/precondition.ts";
import type { Identifiers } from "@/constants/identifiers.ts";

/**
 * Every identifier Kairo attaches to the errors it raises, derived from the runtime constant so the
 * two can never drift apart.
 *
 * @since 1.0.0
 */
export type Identifier = (typeof Identifiers)[keyof typeof Identifiers];

/**
 * The options a `UserError` is constructed with.
 *
 * @since 1.0.0
 */
export interface UserErrorOptions {
	/**
	 * A stable key identifying what went wrong, suitable for translation or branching.
	 */
	identifier: string;

	/**
	 * The human-readable message handed to the `Error` constructor.
	 */
	message?: string;

	/**
	 * Extra detail about the failure, for a handler to inspect.
	 *
	 * @default null
	 */
	context?: unknown;
}

/**
 * The options an `ArgumentError` is constructed with.
 *
 * @since 1.0.0
 */
export interface ArgumentErrorOptions<T>
	extends Omit<UserErrorOptions, "identifier"> {
	/**
	 * The argument that rejected the parameter.
	 */
	argument: Argument<T>;

	/**
	 * The raw text that could not be parsed.
	 */
	parameter: string;

	/**
	 * A stable key identifying what went wrong.
	 *
	 * @default the argument's name
	 */
	identifier?: string;
}

/**
 * The options a `PreconditionError` is constructed with.
 *
 * @since 1.0.0
 */
export interface PreconditionErrorOptions
	extends Omit<UserErrorOptions, "identifier"> {
	/**
	 * The precondition that refused.
	 */
	precondition: Precondition;

	/**
	 * A stable key identifying what went wrong.
	 *
	 * @default the precondition's name
	 */
	identifier?: string;
}
