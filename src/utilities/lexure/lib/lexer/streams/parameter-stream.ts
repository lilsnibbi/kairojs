import type { Parameter, Token } from "@types";
import { QuotedParameter } from "./parameters/quoted-parameter.ts";
import { WordParameter } from "./parameters/word-parameter.ts";
import { TokenType } from "./raw/token-stream.ts";

/**
 * Groups a raw {@link Token} stream into {@link Parameter}s, folding every separator it sees into
 * the `leading` text of the parameter that follows it.
 *
 * @since 1.0.0
 */
export class ParameterStream {
	/**
	 * The raw token stream this instance groups into parameters.
	 */
	private readonly stream: Iterable<Token>;

	/**
	 * The separator tokens accumulated since the last parameter was yielded.
	 */
	private separators: string[] = [];

	/**
	 * @param stream The raw token stream to group into parameters.
	 */
	public constructor(stream: Iterable<Token>) {
		this.stream = stream;
	}

	/**
	 * Iterates the grouped parameters. Any separator tokens left over once the underlying stream is
	 * exhausted — trailing whitespace with nothing after it — are returned as the iterator's final
	 * value rather than yielded.
	 */
	public *[Symbol.iterator](): Iterator<Parameter, string[]> {
		for (const token of this.stream) {
			if (token.type === TokenType.Separator) {
				this.separators.push(token.value);
				continue;
			}

			yield token.type === TokenType.Quoted
				? new QuotedParameter(this.separators, token)
				: new WordParameter(this.separators, token);
			this.separators = [];
		}

		return this.separators;
	}
}
