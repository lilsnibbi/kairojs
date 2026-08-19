import type { PreconditionErrorOptions } from "@types";
import type { Precondition } from "@/structures/precondition.ts";
import { UserError } from "./user-error.ts";

/**
 * Raised when a {@link Precondition} refuses to let a command run.
 *
 * Carries the precondition that objected, so a handler can tell a missing-permission denial apart
 * from a cooldown without parsing the message.
 *
 * @since 1.0.0
 */
export class PreconditionError extends UserError {
	/**
	 * The precondition that refused.
	 */
	public readonly precondition: Precondition;

	/**
	 * @param options The refusing precondition and the usual error details.
	 */
	public constructor(options: PreconditionErrorOptions) {
		super({
			...options,
			identifier: options.identifier ?? options.precondition.name,
		});
		this.precondition = options.precondition;
	}

	public override get name(): string {
		return "PreconditionError";
	}
}
