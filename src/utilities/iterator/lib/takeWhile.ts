/**
 * Alias of {@link filter}.
 *
 * @remarks
 *
 * Despite the name, this is a plain re-export of `filter`, not a short-circuiting "take while
 * true" helper — every element is still tested independently. This matches the upstream
 * behavior being ported.
 *
 * @since 1.0.0
 */
export { filter as takeWhile } from "./filter.ts";
