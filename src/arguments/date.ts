import type {
	ArgumentContext,
	ArgumentResult,
	PieceLoaderContext,
} from "@types";
import { Identifiers } from "@/constants/identifiers.ts";
import { container } from "@/container.ts";
import { resolveDate } from "@/resolvers/index.ts";
import { Argument } from "@/structures/argument.ts";

/**
 * Parses anything the `Date` constructor understands, optionally bounded by two millisecond
 * timestamps taken from the context.
 *
 * @since 1.0.0
 */
export class CoreDateArgument extends Argument<Date> {
	/**
	 * The wording for each way this parse can fail, so an out-of-range date says which end it fell
	 * off rather than only that it was rejected.
	 */
	private readonly messages = {
		[Identifiers.ArgumentDateTooEarly]: ({ minimum }: ArgumentContext<Date>) =>
			`The given date must be after ${new Date(minimum!).toISOString()}.`,
		[Identifiers.ArgumentDateTooFar]: ({ maximum }: ArgumentContext<Date>) =>
			`The given date must be before ${new Date(maximum!).toISOString()}.`,
		[Identifiers.ArgumentDateError]: () =>
			"The argument did not resolve to a date.",
	} as const;

	public constructor(context: PieceLoaderContext<"arguments">) {
		super(context, { name: "date" });
	}

	public run(
		parameter: string,
		context: ArgumentContext<Date>,
	): ArgumentResult<Date> {
		return resolveDate(parameter, {
			minimum: context.minimum,
			maximum: context.maximum,
		}).mapErrInto((identifier) =>
			this.error({
				parameter,
				identifier,
				message: this.messages[identifier](context),
				context,
			}),
		);
	}
}

void container.stores.loadPiece({
	name: "date",
	piece: CoreDateArgument,
	store: "arguments",
});
