import type { AnyListener } from "@types";
import { Store } from "@/loader/store.ts";
import { Listener } from "./listener.ts";
import { ListenerLoaderStrategy } from "./listener-loader-strategy.ts";

/**
 * The store holding every {@link Listener} the bot has loaded.
 *
 * @since 1.0.0
 */
export class ListenerStore extends Store<AnyListener, "listeners"> {
	public constructor() {
		super(Listener, {
			name: "listeners",
			strategy: new ListenerLoaderStrategy(),
		});
	}
}
