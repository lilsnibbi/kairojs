import { AliasStore } from "@/loader/alias-store.ts";
import { PatternCommand } from "./pattern-command.ts";

/**
 * The store holding every {@link PatternCommand} the bot has loaded.
 *
 * Pattern commands are scanned rather than looked up — every message is tested against every entry —
 * so this store adds nothing to what an alias store already does. It exists as its own store so
 * pattern commands live in their own `pattern-commands` folder and never turn up in a help listing
 * built from the regular command store.
 *
 * @since 1.0.0
 */
export class PatternCommandStore extends AliasStore<
	PatternCommand,
	"pattern-commands"
> {
	public constructor() {
		super(PatternCommand, { name: "pattern-commands" });
	}
}
