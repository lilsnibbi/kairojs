import { Identifiers } from "@/constants/identifiers.ts";
import { Result } from "@utilities/result/index.ts";

/**
 * Reads a parameter as an absolute URL.
 *
 * Parsing is delegated to the global `URL` constructor, so whatever the WHATWG URL standard
 * accepts is accepted here. Relative references are rejected, since no base URL is supplied.
 *
 * @param parameter The raw text to interpret.
 * @returns The parsed URL, or `hyperlinkError` when the text is not a valid absolute URL.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/URL/URL the URL constructor}
 *
 * @since 1.0.0
 */
export function resolveHyperlink(
	parameter: string,
): Result<URL, typeof Identifiers.ArgumentHyperlinkError> {
	return Result.from(() => new URL(parameter)).mapErr(
		() => Identifiers.ArgumentHyperlinkError,
	);
}
