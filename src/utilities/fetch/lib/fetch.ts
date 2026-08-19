import type { FetchResultTypes, RequestOptions } from "@types";
import { FetchResultTypes as FetchResultTypesValues } from "./constants.ts";
import { QueryError } from "./query-error.ts";

/**
 * Sends an HTTP(S) request and resolves with the response body parsed as JSON.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param type Defaults to {@link FetchResultTypesValues.JSON}.
 * @returns The parsed body. Defaults to `unknown` — supply a generic type argument or cast the
 * result to type it.
 */
export async function fetch<R>(
	url: URL | string,
	type?: typeof FetchResultTypesValues.JSON,
): Promise<R>;
/**
 * Sends an HTTP(S) request and resolves with the response body parsed as JSON.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type Defaults to {@link FetchResultTypesValues.JSON}.
 * @returns The parsed body. Defaults to `unknown` — supply a generic type argument or cast the
 * result to type it.
 */
export async function fetch<R>(
	url: URL | string,
	options: RequestOptions,
	type?: typeof FetchResultTypesValues.JSON,
): Promise<R>;
/**
 * Sends an HTTP(S) request and resolves with the response body read into a {@link Uint8Array}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	type: typeof FetchResultTypesValues.Buffer,
): Promise<Uint8Array>;
/**
 * Sends an HTTP(S) request and resolves with the response body read into a {@link Uint8Array}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	options: RequestOptions,
	type: typeof FetchResultTypesValues.Buffer,
): Promise<Uint8Array>;
/**
 * Sends an HTTP(S) request and resolves with the response body read into a {@link Blob}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	type: typeof FetchResultTypesValues.Blob,
): Promise<Blob>;
/**
 * Sends an HTTP(S) request and resolves with the response body read into a {@link Blob}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	options: RequestOptions,
	type: typeof FetchResultTypesValues.Blob,
): Promise<Blob>;
/**
 * Sends an HTTP(S) request and resolves with the response body as plain text.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	type: typeof FetchResultTypesValues.Text,
): Promise<string>;
/**
 * Sends an HTTP(S) request and resolves with the response body as plain text.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	options: RequestOptions,
	type: typeof FetchResultTypesValues.Text,
): Promise<string>;
/**
 * Sends an HTTP(S) request and resolves with the raw, unread {@link Response}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	type: typeof FetchResultTypesValues.Result,
): Promise<Response>;
/**
 * Sends an HTTP(S) request and resolves with the raw, unread {@link Response}.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type One of the {@link FetchResultTypesValues} members.
 */
export async function fetch(
	url: URL | string,
	options: RequestOptions,
	type: typeof FetchResultTypesValues.Result,
): Promise<Response>;
/**
 * Sends an HTTP(S) request, resolving with the response body shaped according to `type`.
 *
 * @param url The absolute URL to request. Relative or protocol-relative URLs reject.
 * @param options Forwarded to the underlying {@link Request}, plus an optional `body` that is
 * JSON-stringified automatically when it is a plain serialisable value.
 * @param type One of the {@link FetchResultTypesValues} members.
 *
 * @example
 * ```typescript
 * import { fetch, FetchResultTypes } from "@utilities/fetch/index.ts";
 *
 * const payload = await fetch<{ id: string }>("https://example.com/api/user");
 * const bytes = await fetch("https://example.com/logo.png", FetchResultTypes.Buffer);
 * ```
 */
export async function fetch<R>(
	url: URL | string,
	options: RequestOptions,
	type: FetchResultTypes,
): Promise<Response | Blob | Uint8Array | string | R>;
export async function fetch(
	url: URL | string,
	options?: RequestOptions | FetchResultTypes,
	type?: FetchResultTypes,
) {
	if (typeof options === "undefined") {
		options = {};
		type = FetchResultTypesValues.JSON;
	} else if (typeof options === "string") {
		type = options;
		options = {};
	} else if (typeof type === "undefined") {
		type = FetchResultTypesValues.JSON;
	}

	let { body } = options;

	if (shouldJsonStringify(body)) {
		body = JSON.stringify(body);
	}

	// Normalise the URL to a string, in case a URL object was passed.
	const stringUrl = String(url);

	const response = await globalThis.fetch(stringUrl, {
		...options,
		body: body as RequestInit["body"],
	});
	if (!response.ok)
		throw new QueryError(
			stringUrl,
			response.status,
			response,
			await response.clone().text(),
		);

	switch (type) {
		case FetchResultTypesValues.Result:
			return response;
		case FetchResultTypesValues.Buffer:
			return new Uint8Array(await response.arrayBuffer());
		case FetchResultTypesValues.Blob:
			return response.blob();
		case FetchResultTypesValues.JSON:
			return response.json();
		case FetchResultTypesValues.Text:
			return response.text();
		default:
			throw new Error(`Unknown type "${type}"`);
	}
}

/**
 * Decides whether a request body should be JSON-stringified before being sent — true for plain
 * objects, arrays of serialisable values, and anything exposing `toJSON`, but never for binary
 * payloads or values that are already an acceptable {@link BodyInit}.
 *
 * @param value The candidate request body.
 */
function shouldJsonStringify(value: unknown): boolean {
	if (typeof value !== "object") return false;
	if (value instanceof Uint8Array) return false;

	if (value === null) return true;
	if (value.constructor === undefined) return true;
	if (value.constructor === Object) return true;
	if ("toJSON" in value && typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return value.every(shouldJsonStringify);

	return false;
}
