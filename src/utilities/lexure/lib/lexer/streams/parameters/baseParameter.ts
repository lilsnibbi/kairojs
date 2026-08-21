/**
 * The shared shape of a lexed parameter: the separator text that led into it, plus the concrete
 * {@link raw} rendering each subclass provides.
 *
 * @since 1.0.0
 */
export abstract class BaseParameter {
	/**
	 * Every separator token consumed immediately before this parameter, in order.
	 */
	public readonly separators: readonly string[];

	/**
	 * @param separators The separator tokens that led into this parameter.
	 */
	public constructor(separators: readonly string[]) {
		this.separators = separators;
	}

	/**
	 * The leading separator text, reconstructed by concatenating {@link BaseParameter.separators}.
	 */
	public get leading(): string {
		return this.separators.join("");
	}

	/**
	 * The parameter rendered back to its original source form, including any surrounding quotes.
	 */
	public abstract get raw(): string;
}
