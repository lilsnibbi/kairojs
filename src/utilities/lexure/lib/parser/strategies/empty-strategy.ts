import type { UnorderedStrategy } from "@types";
import { Option } from "@utilities/result/index.ts";

/**
 * An {@link UnorderedStrategy} that recognises no flags and no options, so every parameter falls
 * through to the ordered list. This is the default strategy a {@link Parser} uses when none is
 * given.
 *
 * @since 1.0.0
 */
export class EmptyStrategy implements UnorderedStrategy {
	public matchFlag(): Option<string> {
		return Option.none;
	}

	public matchOption(): Option<readonly [key: string, value: string]> {
		return Option.none;
	}
}
