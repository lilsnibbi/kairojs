import type { Lexer } from "../../lexer.ts";
import type { QuotedToken, SeparatorToken, Token, WordToken } from "@types";

/**
 * The three kinds of {@link Token} the lexer can emit, as a frozen const object standing in for a
 * TypeScript enum — `Parameter` for a bare word, `Quoted` for a matched quote pair, and `Separator`
 * for the text between two tokens.
 *
 * @since 1.0.0
 */
export const TokenType = Object.freeze({
	Parameter: 0,
	Quoted: 1,
	Separator: 2,
} as const);

/**
 * Splits a raw command string into a flat stream of {@link Token}s: separators, quoted spans and
 * plain words.
 *
 * This is the lowest layer of the lexer. It only knows how to match the configured separator and
 * quote pairs — {@link ParameterStream} is what groups its output into full parameters.
 *
 * @since 1.0.0
 */
export class TokenStream implements Iterable<Token> {
	/**
	 * The raw command string being tokenised.
	 */
	private readonly input: string;

	/**
	 * The quote pairs recognised while scanning, taken from the owning {@link Lexer}.
	 */
	private readonly quotes: readonly [string, string][];

	/**
	 * The separator text recognised while scanning, taken from the owning {@link Lexer}.
	 */
	private readonly separator: string;

	/**
	 * The index of the next character to read from {@link TokenStream.input}.
	 */
	private position = 0;

	/**
	 * @param lexer The lexer whose separator and quote configuration this stream follows.
	 * @param input The raw command string to tokenise.
	 */
	public constructor(lexer: Lexer, input: string) {
		this.quotes = lexer.quotes;
		this.separator = lexer.separator;
		this.input = input;
	}

	/**
	 * Whether every character of the input has been consumed.
	 */
	public get finished(): boolean {
		return this.position >= this.input.length;
	}

	public *[Symbol.iterator](): Iterator<Token> {
		while (!this.finished) {
			yield this.getPossibleSeparator() ??
				this.getPossibleQuotedArgument() ??
				this.getParameter();
		}
	}

	/**
	 * Consumes a separator at the current position, if there is one.
	 */
	private getPossibleSeparator(): SeparatorToken | null {
		if (this.input.startsWith(this.separator, this.position)) {
			this.position += this.separator.length;
			return { type: TokenType.Separator, value: this.separator };
		}

		return null;
	}

	/**
	 * Consumes a quoted span starting at the current position, if one of the configured quote pairs
	 * opens there and its closing character is found later in the input.
	 */
	private getPossibleQuotedArgument(): QuotedToken | null {
		for (const [open, close] of this.quotes) {
			if (!this.input.startsWith(open, this.position)) continue;

			const end = this.input.indexOf(close, this.position + open.length);
			if (end === -1) continue;

			const value = this.input.slice(this.position + open.length, end);
			this.position = end + close.length;

			return { type: TokenType.Quoted, value, open, close };
		}

		return null;
	}

	/**
	 * Consumes a bare word, running from the current position up to the next separator or the end
	 * of the input.
	 */
	private getParameter(): WordToken {
		const index = this.input.indexOf(this.separator, this.position);
		const value =
			index === -1
				? this.input.slice(this.position)
				: this.input.slice(this.position, index);
		this.position += value.length;
		return { type: TokenType.Parameter, value };
	}
}
