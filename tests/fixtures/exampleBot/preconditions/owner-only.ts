import { Precondition } from "@/structures/precondition.ts";
import type { PieceLoaderContext } from "@types";
import type { Message } from "discord.js";

// Declaring the precondition here is what lets `preconditions: ["OwnerOnly"]` typecheck on a command.
// Kairo checks those names against this interface, so a misspelled precondition fails to compile
// rather than silently never running.
declare module "@types" {
	interface Preconditions {
		OwnerOnly: never;
	}
}

/** Refuses anyone who is not the configured owner. */
export class OwnerOnlyPrecondition extends Precondition {
	public constructor(context: PieceLoaderContext<"preconditions">) {
		super(context, { name: "OwnerOnly" });
	}

	public override messageRun(message: Message) {
		return message.author.id === OwnerOnlyPrecondition.ownerId
			? this.ok()
			: this.error({ message: "Only the bot owner may use this command." });
	}

	public static ownerId = "0";
}
