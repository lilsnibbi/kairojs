/**
 * The shapes `fetch` can resolve a response body into — derived from the frozen `FetchResultTypes`
 * object.
 *
 * @since 1.0.0
 */
export type FetchResultTypes =
	typeof import("@/utilities/fetch/lib/constants.ts").FetchResultTypes[keyof typeof import("@/utilities/fetch/lib/constants.ts").FetchResultTypes];

/**
 * The HTTP methods `fetch` accepts through {@link RequestOptions.method} — derived from the frozen
 * `FetchMethods` object.
 *
 * @since 1.0.0
 */
export type FetchMethods =
	typeof import("@/utilities/fetch/lib/constants.ts").FetchMethods[keyof typeof import("@/utilities/fetch/lib/constants.ts").FetchMethods];

/**
 * A selection of common IANA media types — derived from the frozen `FetchMediaContentTypes` object.
 *
 * @since 1.0.0
 */
export type FetchMediaContentTypes =
	typeof import("@/utilities/fetch/lib/constants.ts").FetchMediaContentTypes[keyof typeof import("@/utilities/fetch/lib/constants.ts").FetchMediaContentTypes];

/**
 * Options accepted by `fetch`, layered on top of the standard `RequestInit`.
 *
 * @since 1.0.0
 */
export interface RequestOptions extends Omit<RequestInit, "body"> {
	/**
	 * The request body. Plain objects, arrays of serialisable values and anything exposing
	 * `toJSON` are stringified as JSON automatically; anything else is forwarded as-is.
	 */
	body?: RequestInit["body"] | Record<any, any>;
}
