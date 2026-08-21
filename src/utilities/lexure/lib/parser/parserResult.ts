import type { Parameter, UnorderedStrategy } from "@types";
import type { Parser } from "./parser.ts";

/**
 * The outcome of running a {@link Parser} over a stream of {@link Parameter}s: every parameter
 * sorted into the ordered list, the flags that were recognised, and the options that were
 * recognised alongside their values.
 *
 * @since 1.0.0
 */
export class ParserResult {
	/**
	 * Every parameter the configured {@link UnorderedStrategy} did not recognise as a flag or an
	 * option, in the order they appeared.
	 */
	public readonly ordered: Parameter[] = [];

	/**
	 * The names of every flag recognised while parsing.
	 */
	public readonly flags = new Set<string>();

	/**
	 * Every option recognised while parsing, keyed by name. An option given more than once collects
	 * every value it was given, in order.
	 */
	public readonly options = new Map<string, string[]>();

	/**
	 * The strategy used to recognise flags and options, taken from the owning {@link Parser}.
	 */
	readonly #strategy: UnorderedStrategy;

	/**
	 * @param parser The parser whose strategy this result parses with.
	 */
	public constructor(parser: Parser) {
		this.#strategy = parser.strategy;
	}

	/**
	 * Sorts every parameter in the given iterable into {@link ParserResult.ordered},
	 * {@link ParserResult.flags} or {@link ParserResult.options}.
	 *
	 * @param parameters The parameters to parse.
	 */
	public parse(parameters: Iterable<Parameter>): this {
		for (const parameter of parameters) {
			this.parsePossibleFlag(parameter) ||
				this.parsePossibleOptions(parameter) ||
				this.parseOrdered(parameter);
		}

		return this;
	}

	/**
	 * Attempts to record the given parameter as a flag.
	 *
	 * @param parameter The parameter to attempt to match.
	 * @returns Whether the parameter was recognised as a flag.
	 */
	private parsePossibleFlag(parameter: Parameter): boolean {
		return this.#strategy
			.matchFlag(parameter.value)
			.inspect((value) => this.flags.add(value))
			.isSome();
	}

	/**
	 * Attempts to record the given parameter as an option.
	 *
	 * @param parameter The parameter to attempt to match.
	 * @returns Whether the parameter was recognised as an option.
	 */
	private parsePossibleOptions(parameter: Parameter): boolean {
		return this.#strategy
			.matchOption(parameter.value)
			.inspect(([key, value]) => {
				const existing = this.options.get(key);
				if (existing) existing.push(value);
				else this.options.set(key, [value]);
			})
			.isSome();
	}

	/**
	 * Records the given parameter as an ordered parameter. Always succeeds.
	 *
	 * @param parameter The parameter to record.
	 */
	private parseOrdered(parameter: Parameter): boolean {
		this.ordered.push(parameter);
		return true;
	}
}
