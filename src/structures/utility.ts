import type { UtilityOptions } from "@types";
import { Piece } from "@/loader/piece.ts";

/**
 * A helper a bot loads once and reaches from anywhere.
 *
 * Utilities exist for the code that is neither a command nor a listener but is needed by both — a
 * formatter, a cache wrapper, an API client. Loading them as pieces means they take part in the
 * same lifecycle as everything else: they are discovered on disk, can be reloaded, and are reachable
 * through `container.utilities` under their own name.
 *
 * @example
 * ```typescript
 * import { Utility } from "kairojs";
 *
 * export class MathUtility extends Utility {
 *   public constructor(context: PieceLoaderContext<"utilities">) {
 *     super(context, { name: "math" });
 *   }
 *
 *   public add(first: number, second: number) {
 *     return first + second;
 *   }
 * }
 *
 * declare module "kairojs" {
 *   interface Utilities {
 *     math: MathUtility;
 *   }
 * }
 *
 * // Anywhere else:
 * container.utilities.math.add(1, 2);
 * ```
 *
 * @since 1.0.0
 */
export abstract class Utility<
	Options extends UtilityOptions = UtilityOptions,
> extends Piece<Options, "utilities"> {}
