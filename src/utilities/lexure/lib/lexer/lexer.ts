import type { LexerOptions } from "@types";
import { ParameterStream } from "./streams/parameterStream.ts";
import { TokenStream } from "./streams/raw/tokenStream.ts";

/**
 * Configures and drives the splitting of a raw command string into {@link ParameterStream}s and
 * {@link TokenStream}s.
 *
 * This is the entry point of the whole package: everything else — tokenising, grouping into
 * parameters, and later parsing flags and options out of them — starts from a run of this class.
 *
 * @example
 * ```typescript
 * import { Lexer } from "@utilities/lexure/index.ts";
 *
 * const lexer = new Lexer({ quotes: [['"', '"']] });
 * const parameters = [...lexer.run('say "hello world" --loud')];
 * ```
 *
 * @since 1.0.0
 */
export class Lexer {
	/**
	 * The configured quote pairs, each capturing everything between an opening and closing
	 * character as a single quoted parameter.
	 */
	public readonly quotes: readonly [open: string, close: string][];

	/**
	 * The text that separates one parameter from the next.
	 */
	public readonly separator: string;

	/**
	 * @param options Configures the separator and quote pairs this lexer recognises.
	 */
	public constructor(options: LexerOptions = {}) {
		this.quotes = options.quotes ?? [];
		this.separator = options.separator ?? " ";
	}

	/**
	 * Tokenises and groups the given input into a {@link ParameterStream}.
	 *
	 * @param input The raw command string to lex.
	 */
	public run(input: string): ParameterStream {
		return new ParameterStream(this.raw(input));
	}

	/**
	 * Tokenises the given input without grouping it into parameters.
	 *
	 * @param input The raw command string to lex.
	 */
	public raw(input: string): TokenStream {
		return new TokenStream(this, input);
	}
}
