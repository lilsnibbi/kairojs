/**
 * The shapes `fetch` can resolve a response body into.
 *
 * @since 1.0.0
 */
export const FetchResultTypes = Object.freeze({
	/**
	 * Parses the body as JSON. Cast or supply a generic type argument to `fetch` to type the
	 * result — it is `unknown` otherwise.
	 */
	JSON: "json",

	/**
	 * Reads the body into a {@link Uint8Array}.
	 */
	Buffer: "buffer",

	/**
	 * Reads the body into a {@link Blob}.
	 */
	Blob: "blob",

	/**
	 * Reads the body as plain text.
	 */
	Text: "text",

	/**
	 * Returns the raw {@link Response} without reading the body at all.
	 */
	Result: "result",
} as const);

/**
 * The {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods HTTP methods} `fetch`
 * accepts through {@link RequestOptions.method}.
 *
 * @since 1.0.0
 */
export const FetchMethods = Object.freeze({
	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET MDN / Web / HTTP / Methods / GET}
	 */
	Get: "GET",

	/**
	 * Identical to {@link FetchMethods.Get}, but the response has no body.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD MDN / Web / HTTP / Methods / HEAD}
	 */
	Head: "HEAD",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST MDN / Web / HTTP / Methods / POST}
	 */
	Post: "POST",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT MDN / Web / HTTP / Methods / PUT}
	 */
	Put: "PUT",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE MDN / Web / HTTP / Methods / DELETE}
	 */
	Delete: "DELETE",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT MDN / Web / HTTP / Methods / CONNECT}
	 */
	Connect: "CONNECT",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS MDN / Web / HTTP / Methods / OPTIONS}
	 */
	Options: "OPTIONS",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/TRACE MDN / Web / HTTP / Methods / TRACE}
	 */
	Trace: "TRACE",

	/**
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH MDN / Web / HTTP / Methods / PATCH}
	 */
	Patch: "PATCH",
} as const);

/**
 * A selection of common {@link https://www.iana.org/assignments/media-types/media-types.xhtml IANA media types},
 * for use in headers such as `Content-Type` and `Accept`.
 *
 * @since 1.0.0
 */
export const FetchMediaContentTypes = Object.freeze({
	AudioAac: "audio/aac",
	AudioMp4: "audio/mp4",
	AudioMpeg: "audio/mpeg",
	AudioOgg: "audio/ogg",
	AudioOpus: "audio/opus",
	AudioVorbis: "audio/vorbis",
	AudioWav: "audio/wav",
	AudioWebm: "audio/webm",
	FontOtf: "font/otf",
	FontTtf: "font/ttf",
	FontWoff: "font/woff",
	FontWoff2: "font/woff2",
	FormData: "multipart/form-data",
	FormURLEncoded: "application/x-www-form-urlencoded",
	ImageAPNG: "image/apng",
	ImageGIF: "image/gif",
	ImageJPEG: "image/jpeg",
	ImagePNG: "image/png",
	ImageWEBP: "image/webp",
	JSON: "application/json",
	JavaScript: "application/javascript",
	OctetStream: "application/octet-stream",
	TextCSS: "text/css",
	TextHTML: "text/html",
	TextPlain: "text/plain",
	VideoH264: "video/h264",
	VideoH265: "video/h265",
	VideoMp4: "video/mp4",
	VideoOgg: "video/ogg",
	VideoWebm: "video/webm",
	XML: "application/xml",
} as const);
