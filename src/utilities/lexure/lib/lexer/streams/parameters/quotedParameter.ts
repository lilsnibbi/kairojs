import type { QuotedToken } from "@types";
import { BaseParameter } from "./baseParameter.ts";

/**
 * A parameter captured between a matched pair of quote characters.
 *
 * @since 1.0.0
 */
export class QuotedParameter extends BaseParameter {
	/**
	 * The text captured between the quotes, with the quote characters themselves stripped.
	 */
	public readonly value: string;

	/**
	 * The opening quote character that started this parameter.
	 */
	public readonly open: string;

	/**
	 * The closing quote character that ended this parameter.
	 */
	public readonly close: string;

	/**
	 * @param separators The separator tokens that led into this parameter.
	 * @param token The quoted token this parameter wraps.
	 */
	public constructor(
		separators: readonly string[],
		token: Omit<QuotedToken, "type">,
	) {
		super(separators);
		this.value = token.value;
		this.open = token.open;
		this.close = token.close;
	}

	public get raw(): string {
		return `${this.open}${this.value}${this.close}`;
	}
}
