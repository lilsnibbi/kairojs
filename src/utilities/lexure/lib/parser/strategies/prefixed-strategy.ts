import type { UnorderedStrategy } from "@types";
import { Option } from "@utilities/result/index.ts";

/**
 * An {@link UnorderedStrategy} that recognises flags and options by a configurable set of
 * prefixes and key/value separators — for example `--flag` or `--key=value`.
 *
 * @since 1.0.0
 */
export class PrefixedStrategy implements UnorderedStrategy {
	/**
	 * The prefixes that mark a parameter as a flag or an option, checked in order.
	 */
	public readonly prefixes: readonly string[];

	/**
	 * The separators that mark the boundary between an option's key and its value, checked in order.
	 */
	public readonly separators: readonly string[];

	/**
	 * @param prefixes The prefixes that mark a parameter as a flag or an option.
	 * @param separators The separators that mark the boundary between an option's key and its value.
	 */
	public constructor(
		prefixes: readonly string[],
		separators: readonly string[],
	) {
		this.prefixes = prefixes;
		this.separators = separators;
	}

	public matchFlag(input: string): Option<string> {
		const prefix = this.prefixes.find((candidate) =>
			input.startsWith(candidate),
		);

		// If the prefix is missing, this is not a flag:
		if (!prefix) return Option.none;

		// If a key/value separator is present, this is an option, not a flag:
		if (
			this.separators.some((separator) =>
				input.includes(separator, prefix.length),
			)
		)
			return Option.none;

		return Option.some(input.slice(prefix.length));
	}

	public matchOption(
		input: string,
	): Option<readonly [key: string, value: string]> {
		const prefix = this.prefixes.find((candidate) =>
			input.startsWith(candidate),
		);

		// If the prefix is missing, this is not an option:
		if (!prefix) return Option.none;

		for (const separator of this.separators) {
			const index = input.indexOf(separator, prefix.length + 1);

			// If this separator is missing, try the next one:
			if (index === -1) continue;

			// If the separator is present but carries no value, this is not a valid option:
			if (index + separator.length === input.length) return Option.none;

			const key = input.slice(prefix.length, index);
			const value = input.slice(index + separator.length);
			return Option.some([key, value] as const);
		}

		return Option.none;
	}
}
