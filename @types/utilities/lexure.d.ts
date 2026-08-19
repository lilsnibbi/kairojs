import type { Option } from "@utilities/result/lib/option.ts";
import type { QuotedParameter } from "@/utilities/lexure/lib/lexer/streams/parameters/quoted-parameter.ts";
import type { WordParameter } from "@/utilities/lexure/lib/lexer/streams/parameters/word-parameter.ts";

/**
 * The kinds of {@link Token} the lexer can emit — derived from the frozen `TokenType` object.
 *
 * @since 1.0.0
 */
export type TokenType =
	typeof import("@/utilities/lexure/lib/lexer/streams/raw/token-stream.ts").TokenType[keyof typeof import("@/utilities/lexure/lib/lexer/streams/raw/token-stream.ts").TokenType];

/**
 * A bare word, unbroken by a separator or a quote pair.
 *
 * @since 1.0.0
 */
export interface WordToken {
	readonly type: typeof import("@/utilities/lexure/lib/lexer/streams/raw/token-stream.ts").TokenType.Parameter;
	readonly value: string;
}

/**
 * The text captured between a matched pair of quote characters, with the quotes themselves stripped.
 *
 * @since 1.0.0
 */
export interface QuotedToken {
	readonly type: typeof import("@/utilities/lexure/lib/lexer/streams/raw/token-stream.ts").TokenType.Quoted;
	readonly value: string;
	readonly open: string;
	readonly close: string;
}

/**
 * The literal separator text — usually whitespace — that sits between two tokens.
 *
 * @since 1.0.0
 */
export interface SeparatorToken {
	readonly type: typeof import("@/utilities/lexure/lib/lexer/streams/raw/token-stream.ts").TokenType.Separator;
	readonly value: string;
}

/**
 * Any single unit {@link TokenStream} can emit while walking a raw command string.
 *
 * @since 1.0.0
 */
export type Token = WordToken | QuotedToken | SeparatorToken;

/**
 * The options accepted by {@link Lexer}'s constructor.
 *
 * @since 1.0.0
 */
export interface LexerOptions {
	/**
	 * The text that separates one parameter from the next. Defaults to a single space.
	 */
	separator?: string;

	/**
	 * Pairs of opening and closing characters that, when matched, capture everything between them
	 * as a single quoted parameter instead of splitting on the separator.
	 */
	quotes?: readonly [open: string, close: string][];
}

/**
 * Either half of a matched quote pair ({@link QuotedParameter}) or a single unquoted word
 * ({@link WordParameter}) — the unit {@link ParameterStream} yields.
 *
 * @since 1.0.0
 */
export type Parameter = QuotedParameter | WordParameter;

/**
 * The bookkeeping {@link ArgumentStream} keeps so a caller can save its progress and later
 * {@link ArgumentStream.restore | restore} it — for example when a command tries several parses of
 * the same input and needs to roll back after a failed attempt.
 *
 * @since 1.0.0
 */
export interface ArgumentStreamState {
	/**
	 * The indices, into {@link ParserResult.ordered}, of every ordered parameter already consumed.
	 */
	used: Set<number>;

	/**
	 * The index {@link ArgumentStream.single} and friends resume scanning from.
	 */
	position: number;
}

/**
 * Recognises flags (`--verbose`) and key/value options (`--limit=5`) out of the unordered
 * parameters a {@link Parser} encounters, leaving everything it does not recognise to fall through
 * as an ordered parameter.
 *
 * Implement this to customise how flags and options are written — {@link EmptyStrategy} disables
 * the feature entirely, while {@link PrefixedStrategy} is the configurable prefix-based default.
 *
 * @since 1.0.0
 */
export interface UnorderedStrategy {
	/**
	 * Attempts to read the given parameter's raw value as a flag.
	 *
	 * @param input The parameter's raw value.
	 * @returns The flag's name, if `input` matched one.
	 */
	matchFlag(input: string): Option<string>;

	/**
	 * Attempts to read the given parameter's raw value as a key/value option.
	 *
	 * @param input The parameter's raw value.
	 * @returns The option's key and value, if `input` matched one.
	 */
	matchOption(input: string): Option<readonly [key: string, value: string]>;
}
