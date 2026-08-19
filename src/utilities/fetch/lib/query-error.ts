/**
 * Thrown by `fetch` whenever the response's status indicates failure, carrying enough context to
 * inspect what went wrong without re-reading the response body by hand.
 *
 * @since 1.0.0
 */
export class QueryError extends Error {
	/**
	 * The URL that was requested.
	 */
	public readonly url: string;

	/**
	 * The response's HTTP status code.
	 */
	public readonly code: number;

	/**
	 * The response body, read into a string.
	 */
	public readonly body: string;

	/**
	 * The original {@link Response} object.
	 */
	public readonly response: Response;

	/**
	 * The lazily-parsed JSON form of {@link QueryError.body}.
	 */
	#json: unknown;

	/**
	 * @param url The URL that was requested.
	 * @param code The response's HTTP status code.
	 * @param response The original {@link Response} object.
	 * @param body The response body, read into a string.
	 */
	public constructor(
		url: string,
		code: number,
		response: Response,
		body: string,
	) {
		super(`Failed to request '${url}' with code ${code}.`);
		this.url = url;
		this.code = code;
		this.body = body;
		this.response = response;
		this.#json = null;
	}

	/**
	 * Parses {@link QueryError.body} as JSON, caching the result for subsequent calls.
	 */
	public toJSON(): unknown {
		this.#json ??= JSON.parse(this.body);
		return this.#json;
	}
}
