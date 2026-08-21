import type { Utilities } from "@/structures/utilityStore.ts";
import type { PieceJSON, PieceLocationJSON, PieceOptions } from "./loader.d.ts";

/**
 * The options a `Utility` is constructed with.
 *
 * A utility is the plainest piece there is — it exists to be reached by name, so it adds nothing to
 * what every piece already accepts.
 *
 * @since 1.0.0
 */
export interface UtilityOptions extends PieceOptions {}

/**
 * The shape produced by `Utility#toJSON`.
 *
 * @since 1.0.0
 */
export interface UtilityJSON extends PieceJSON {}

/**
 * The shape produced by a utility's `location.toJSON()`.
 *
 * @since 1.0.0
 */
export interface UtilityLocationJSON extends PieceLocationJSON {}

declare module "./loader.d.ts" {
	interface Container {
		/**
		 * Every loaded utility, published under its own name.
		 */
		utilities: Utilities;
	}
}
