import type { UserErrorOptions } from "@types";

/**
 * The error type Kairo raises for problems a bot's user caused rather than the bot itself — a
 * malformed argument, a failed precondition, a command used in the wrong place.
 *
 * The `identifier` is the part worth branching on: it is stable across message changes, which makes
 * it usable as a translation key or a `switch` subject.
 *
 * @example
 * ```typescript
 * throw new UserError({
 *   identifier: "AddArgumentError",
 *   message: "You must give two numbers, but the second one was not a number.",
 *   context: { received: 2, expected: 3 }
 * });
 * ```
 *
 * @since 1.0.0
 */
export class UserError extends Error {
	/**
	 * A stable key identifying what went wrong, suitable for translation or branching.
	 */
	public readonly identifier: string;

	/**
	 * Whatever extra detail the thrower attached, or `null` if none was given.
	 */
	public readonly context: unknown;

	/**
	 * @param options The identifier, message and context for this error.
	 */
	public constructor(options: UserErrorOptions) {
		super(options.message);
		this.identifier = options.identifier;
		this.context = options.context ?? null;
	}

	public override get name(): string {
		return "UserError";
	}
}
