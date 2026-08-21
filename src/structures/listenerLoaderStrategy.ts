import type { AnyListener } from "@types";
import { LoaderStrategy } from "@/loader/strategy.ts";
import type { ListenerStore } from "./listenerStore.ts";

/**
 * Attaches a {@link Listener} to its emitter when the piece loads, and detaches it again when the
 * piece unloads.
 *
 * The detach half is what makes hot reloading safe: without it, reloading a listener would leave the
 * previous callback attached and the handler would run twice.
 *
 * @since 1.0.0
 */
export class ListenerLoaderStrategy extends LoaderStrategy<AnyListener> {
	public override onLoad(_store: ListenerStore, piece: AnyListener) {
		const callback = piece.boundCallback;
		if (!callback) return;

		const emitter = piece.emitter!;

		// Each attached listener raises the emitter's ceiling by one, so a bot with many listeners on
		// the same event does not trip the max-listeners warning. Zero means "no limit"; leave it.
		const maxListeners = emitter.getMaxListeners();
		if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);

		emitter[piece.once ? "once" : "on"](piece.event, callback);
	}

	public override onUnload(_store: ListenerStore, piece: AnyListener) {
		const callback = piece.boundCallback;
		if (!callback) return;

		const emitter = piece.emitter!;

		const maxListeners = emitter.getMaxListeners();
		if (maxListeners !== 0) emitter.setMaxListeners(maxListeners - 1);

		// Detach unconditionally, including `once` listeners. A `once` listener that already fired is
		// gone and this is a harmless no-op; one that has not fired yet would otherwise stay attached
		// after its piece was unloaded, which is exactly the leak hot reloading would keep hitting.
		emitter.off(piece.event, callback);
		piece.boundCallback = null;
	}
}
