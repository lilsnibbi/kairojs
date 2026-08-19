import type { WordToken } from "@types";
import { BaseParameter } from "./base-parameter.ts";

/**
 * A bare word parameter, unbroken by a separator or a quote pair.
 *
 * @since 1.0.0
 */
export class WordParameter extends BaseParameter {
	/**
	 * The word's text.
	 */
	public readonly value: string;

	/**
	 * @param separators The separator tokens that led into this parameter.
	 * @param token The word token this parameter wraps.
	 */
	public constructor(
		separators: readonly string[],
		token: Omit<WordToken, "type">,
	) {
		super(separators);
		this.value = token.value;
	}

	public get raw(): string {
		return this.value;
	}
}
