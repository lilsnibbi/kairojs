import { Store } from "@/loader/store.ts";
import { container } from "@/container.ts";
import { Utility } from "./utility.ts";

/**
 * The store holding every {@link Utility} the bot has loaded.
 *
 * Utilities are meant to be reached by name rather than iterated, so once they are all loaded the
 * store hands each one to {@link Utilities.exposePiece}. That is what turns
 * `container.stores.get("utilities").get("math")` into the far shorter `container.utilities.math`.
 *
 * @since 1.0.0
 */
export class UtilitiesStore extends Store<Utility, "utilities"> {
	public constructor() {
		super(Utility, { name: "utilities" });
	}

	/**
	 * Loads every utility, then publishes each one onto the shared {@link Utilities} holder.
	 *
	 * Re-running this after a reload republishes the fresh instances over the stale ones, so a
	 * property never keeps pointing at a piece that has since been replaced.
	 */
	public override async loadAll() {
		await super.loadAll();

		const { utilities } = container;
		if (!utilities) return;

		for (const [name, piece] of this.entries())
			utilities.exposePiece(name, piece);
	}
}

/**
 * The shared holder every loaded {@link Utility} is published onto.
 *
 * Constructing one assigns it to `container.utilities` and creates the store that fills it, which is
 * why the client only has to register `new Utilities().store` for the whole thing to work.
 *
 * @example
 * ```typescript
 * import { container } from "kairojs";
 *
 * // A utility named "math" is reachable directly:
 * const math = container.utilities.math;
 * ```
 *
 * @since 1.0.0
 */
export class Utilities {
	/**
	 * The store whose pieces are published onto this holder.
	 */
	public readonly store: UtilitiesStore;

	public constructor() {
		// Assigned before the store exists, because the store publishes back onto this holder as
		// soon as it has finished loading.
		container.utilities = this;
		this.store = new UtilitiesStore();
	}

	/**
	 * Publishes a utility onto this holder under its own name.
	 *
	 * @param name The name the utility is stored under.
	 * @param piece The utility to publish.
	 */
	public exposePiece(name: string, piece: Utility) {
		Reflect.set(this, name, piece);
	}
}
