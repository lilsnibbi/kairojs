import { container } from "@/container.ts";
import { CoreApplicationCommandRegistriesBulkOverwriteListener } from "./registriesBulkOverwrite.ts";
import { CoreApplicationCommandRegistriesInitialisingListener } from "./registriesInitialising.ts";
import { CoreApplicationCommandRegistriesRegisteredListener } from "./registriesRegistered.ts";

/**
 * Registers the listeners that narrate application command registration to the logger.
 *
 * They report progress only and change nothing, which is why they are opt-out: switch them off with
 * `loadApplicationCommandRegistriesStatusListeners: false` and registration still happens, silently.
 *
 * @since 1.0.0
 */
export function loadApplicationCommandRegistriesListeners() {
	const store = "listeners" as const;

	void container.stores.loadPiece({
		name: "CoreApplicationCommandRegistriesInitialising",
		piece: CoreApplicationCommandRegistriesInitialisingListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreApplicationCommandRegistriesRegistered",
		piece: CoreApplicationCommandRegistriesRegisteredListener,
		store,
	});
	void container.stores.loadPiece({
		name: "CoreApplicationCommandRegistriesBulkOverwrite",
		piece: CoreApplicationCommandRegistriesBulkOverwriteListener,
		store,
	});
}
