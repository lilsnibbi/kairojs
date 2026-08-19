import type { Ctor } from "@types";

/**
 * Checks whether a value is a class constructor.
 *
 * This is the canonical class check Kairo relies on — the piece loader uses it to decide whether
 * an imported module export is a piece class before attempting to instantiate it.
 *
 * @param input The value to check.
 * @returns `true` if `input` is a function with a `prototype` object, which every `class` has.
 *
 * @since 1.0.0
 */
export function isClass(input: unknown): input is Ctor {
	return typeof input === "function" && typeof input.prototype === "object";
}
