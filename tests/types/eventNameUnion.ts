// Regression guard: `keyof EventMap<T>` collapses to `never` when `T` is a union or `any`, because
// `keyof (A | B)` keeps only the keys A and B share. That made `Listener<any, any>` uninstantiable
// and broke ListenerStore. `EventNameFor<T>` distributes over T first, then unions the keys.
import type { AnyListener, EventArgs, EventNameFor, EventType } from "@types";
import type { ClientEvents } from "discord.js";

// A single source still narrows to exactly that source's event names.
type ClientNames = EventNameFor<"client">;
const clientName: ClientNames = "messageCreate";
type _ClientNamesAreClientEvents = ClientNames extends keyof ClientEvents
	? true
	: never;
const clientNamesNarrow: _ClientNamesAreClientEvents = true;

// The full union must NOT collapse to never — this is the bug being guarded.
type AllNames = EventNameFor<EventType>;
type _AllNamesNotNever = [AllNames] extends [never] ? never : true;
const allNamesUsable: _AllNamesNotNever = true;

// Names from each individual source survive into the union.
const nameFromClient: AllNames = "messageCreate";
const nameFromRest: AllNames = "rateLimited";

// Argument tuples still resolve for a concrete source/event pair.
type ReadyArgs = EventArgs<"client", "messageCreate">;
type _ReadyIsTuple = ReadyArgs extends unknown[] ? true : never;
const readyIsTuple: _ReadyIsTuple = true;

// AnyListener must be a usable type, not never.
type _AnyListenerUsable = [AnyListener] extends [never] ? never : true;
const anyListenerUsable: _AnyListenerUsable = true;

export {
	clientName,
	clientNamesNarrow,
	allNamesUsable,
	nameFromClient,
	nameFromRest,
	readyIsTuple,
	anyListenerUsable,
};
