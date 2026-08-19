import { AliasStore } from "@/loader/alias-store.ts";
import { Argument } from "./argument.ts";

/**
 * The store holding every {@link Argument} the bot has loaded.
 *
 * It is an alias store because a parser is commonly reachable under more than one name — the
 * built-in `hyperlink` argument also answers to `url`, so both spellings resolve to the same piece.
 *
 * @since 1.0.0
 */
export class ArgumentStore extends AliasStore<Argument, "arguments"> {
	public constructor() {
		super(Argument, { name: "arguments" });
	}
}
