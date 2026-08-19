// Standalone proof of the EventMap / EventArgs design, independent of the framework structures
// that are still being written. Mirrors @types/events.d.ts exactly.
import type {
	ClientEvents,
	RestEvents,
	Message,
	OmitPartialGroupDMChannel,
} from "discord.js";

// biome-ignore lint/complexity/noBannedTypes: mirrors the deliberately empty CustomEvents type
type CustomEventsEmpty = {};
interface CustomEventsFilled {
	memberVerified: [id: string, method: "captcha" | "manual"];
}

type EventType = "client" | "rest" | "custom";

type MapFor<C, T extends EventType> = T extends "client"
	? ClientEvents
	: T extends "rest"
		? RestEvents
		: keyof C extends never
			? {
					"no custom events have been declared — augment the CustomEvents interface": [];
				}
			: C;

type ArgsFor<C, T extends EventType, K extends keyof MapFor<C, T>> = Extract<
	MapFor<C, T>[K],
	unknown[]
>;

// --- client source infers discord.js tuples --------------------------------
type MessageCreateArgs = ArgsFor<CustomEventsFilled, "client", "messageCreate">;
const assertMessageCreate: MessageCreateArgs = [
	null as unknown as OmitPartialGroupDMChannel<Message>,
];
// The tuple carries discord.js own precise type, not a widened one.
type _MessageIsMessage = MessageCreateArgs[0] extends Message ? true : never;
const messageTupleIsMessage: _MessageIsMessage = true;

// --- rest source resolves to RestEvents ------------------------------------
type RestKeys = keyof MapFor<CustomEventsFilled, "rest">;
const aRestKey: RestKeys = "rateLimited";

// --- custom source, augmented ----------------------------------------------
type VerifiedArgs = ArgsFor<CustomEventsFilled, "custom", "memberVerified">;
const verified: VerifiedArgs = ["123", "captcha"];

// --- custom source, unaugmented: falls back to the named placeholder --------
type EmptyKeys = keyof MapFor<CustomEventsEmpty, "custom">;
const fallbackKey: EmptyKeys =
	"no custom events have been declared — augment the CustomEvents interface";
type _FallbackIsNotNever = [EmptyKeys] extends [never] ? never : true;
const fallbackIsUsable: _FallbackIsNotNever = true;

export {
	assertMessageCreate,
	messageTupleIsMessage,
	aRestKey,
	verified,
	fallbackKey,
	fallbackIsUsable,
};
