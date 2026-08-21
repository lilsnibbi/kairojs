import type { Parameter, UnorderedStrategy } from "@types";
import { ParserResult } from "./parserResult.ts";
import { EmptyStrategy } from "./strategies/emptyStrategy.ts";

/**
 * Runs a stream of {@link Parameter}s through an {@link UnorderedStrategy}, sorting them into a
 * {@link ParserResult} of ordered parameters, flags and options.
 *
 * @since 1.0.0
 */
export class Parser {
	/**
	 * The strategy used to recognise flags and options. Defaults to {@link EmptyStrategy}, which
	 * recognises none.
	 */
	public strategy: UnorderedStrategy;

	/**
	 * @param strategy The strategy used to recognise flags and options. Defaults to
	 * {@link EmptyStrategy}.
	 */
	public constructor(strategy?: UnorderedStrategy) {
		this.strategy = strategy ?? new EmptyStrategy();
	}

	/**
	 * Replaces the strategy used to recognise flags and options.
	 *
	 * @param strategy The strategy to use from now on.
	 */
	public setUnorderedStrategy(strategy: UnorderedStrategy): this {
		this.strategy = strategy;
		return this;
	}

	/**
	 * Parses the given parameters into a {@link ParserResult}.
	 *
	 * @param input The parameters to parse.
	 */
	public run(input: Iterable<Parameter>): ParserResult {
		return new ParserResult(this).parse(input);
	}
}
