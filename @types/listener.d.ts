import type { EventEmitter } from "node:events";
import type { EventNameFor, EventType } from "./events.d.ts";
import type { PieceJSON, PieceOptions } from "./loader.d.ts";

/**
 * The options a `Listener` is constructed with.
 *
 * `emitter` is only meaningful — and only required — when `type` is `"custom"`; the `client` and
 * `rest` sources resolve their emitter from the client itself.
 *
 * @since 1.0.0
 */
export interface ListenerOptions<
	Type extends EventType = "client",
	Event extends EventNameFor<Type> = EventNameFor<Type>,
> extends PieceOptions {
	/**
	 * Which source the event comes from. This choice determines which event names are valid and what
	 * arguments `run` receives.
	 *
	 * @default "client"
	 */
	readonly type?: Type;

	/**
	 * The event to listen to.
	 *
	 * @default the piece's name
	 */
	readonly event?: Event;

	/**
	 * Whether the listener detaches itself after firing once.
	 *
	 * @default false
	 */
	readonly once?: boolean;

	/**
	 * The emitter to attach to. Required when `type` is `"custom"`, ignored otherwise.
	 */
	readonly emitter?: EventEmitter;
}

/**
 * The shape produced by `Listener#toJSON`.
 *
 * @since 1.0.0
 */
export interface ListenerJSON extends PieceJSON {
	type: EventType;
	event: string | symbol;
	once: boolean;
}

/**
 * Any listener at all, whatever source and event it declares.
 *
 * The store and the loader strategy hold listeners of every shape at once, so they need a type that
 * is deliberately not narrowed to one source.
 *
 * @since 1.0.0
 */
export type AnyListener = import("@/structures/listener.ts").Listener<
	EventType,
	EventNameFor<EventType>
>;
