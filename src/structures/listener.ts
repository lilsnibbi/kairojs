import type { EventEmitter } from "node:events";
import type {
	AnyListener,
	EventArgs,
	EventNameFor,
	EventType,
	ListenerJSON,
	ListenerOptions,
	PieceLoaderContext,
} from "@types";
import { Result } from "@utilities/result/index.ts";
import { Events } from "@/constants/events.ts";
import { Piece } from "@/loader/piece.ts";

/**
 * A piece that runs whenever a given event fires.
 *
 * A listener declares where its event comes from through `type`, and that choice alone determines
 * which event names are valid and what arguments {@link Listener.run} receives — all of it inferred,
 * with no per-event payload interface to write:
 *
 * - `"client"` — anything the discord.js client emits, which includes every event Kairo emits itself.
 * - `"rest"` — anything the REST manager emits, such as rate-limit warnings.
 * - `"custom"` — an event of your own, on an emitter you supply. Augment `CustomEvents` to type it.
 *
 * @example
 * ```typescript
 * import { Events, Listener } from "kairojs";
 *
 * export class ReadyListener extends Listener<"client", typeof Events.ClientReady> {
 *   public constructor(context: PieceLoaderContext<"listeners">) {
 *     super(context, { type: "client", event: Events.ClientReady, once: true });
 *   }
 *
 *   public run(client: Client<true>) {
 *     this.container.client.id ??= client.user.id;
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Listening to an event of your own, on your own emitter.
 * declare module "kairojs" {
 *   interface CustomEvents {
 *     memberVerified: [member: GuildMember, method: "captcha" | "manual"];
 *   }
 * }
 *
 * export class VerifiedListener extends Listener<"custom", "memberVerified"> {
 *   public constructor(context: PieceLoaderContext<"listeners">) {
 *     super(context, { type: "custom", event: "memberVerified", emitter: verificationEmitter });
 *   }
 *
 *   public run(member: GuildMember, method: "captcha" | "manual") {
 *     this.container.logger.info(`${member.id} verified via ${method}.`);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class Listener<
	Type extends EventType = "client",
	Event extends EventNameFor<Type> = EventNameFor<Type>,
	Options extends ListenerOptions<Type, Event> = ListenerOptions<Type, Event>,
> extends Piece<Options, "listeners"> {
	/**
	 * Which source this listener's event comes from.
	 */
	public readonly type: Type;

	/**
	 * The emitter this listener is attached to, resolved from {@link Listener.type}.
	 */
	public readonly emitter: EventEmitter | null;

	/**
	 * The name of the event being listened to. Defaults to the piece's name.
	 */
	public readonly event: string | symbol;

	/**
	 * Whether this listener detaches itself after firing once.
	 */
	public readonly once: boolean;

	/**
	 * The bound callback actually registered on the emitter, kept so it can be detached again.
	 *
	 * @internal
	 */
	public boundCallback: ((...args: any[]) => void) | null;

	/**
	 * @param context Supplied by the store: where the piece came from and who loaded it.
	 * @param options Which source and event to listen to, and whether to fire only once.
	 */
	public constructor(
		context: PieceLoaderContext<"listeners">,
		options: Options = {} as Options,
	) {
		super(context, options);

		this.type = (options.type ?? "client") as Type;
		this.emitter = this.resolveEmitter(options);
		this.event = (options.event as string | symbol) ?? this.name;
		this.once = options.once ?? false;

		this.boundCallback =
			this.emitter && this.event
				? this.once
					? this.invokeOnce.bind(this)
					: this.invoke.bind(this)
				: null;

		// Nothing to attach to means the listener can never fire, so keep it out of the store.
		if (this.emitter === null || this.boundCallback === null)
			this.enabled = false;
	}

	/**
	 * Runs when the event fires. The parameters are inferred from `type` and `event`, so they are
	 * exactly the arguments the emitter supplies.
	 */
	public abstract run(...args: EventArgs<Type, Event>): unknown;

	/**
	 * Defines how this listener is serialised by `JSON.stringify`.
	 */
	public override toJSON(): ListenerJSON {
		return {
			...super.toJSON(),
			type: this.type,
			once: this.once,
			event: this.event,
		};
	}

	/**
	 * Works out which emitter to attach to from the declared source.
	 *
	 * `custom` is the only source that needs an emitter supplied, and it is an error to omit one —
	 * silently disabling the listener would leave no clue why it never fires.
	 */
	private resolveEmitter(options: Options): EventEmitter | null {
		switch (options.type ?? "client") {
			case "rest":
				return this.container.client.rest as unknown as EventEmitter;
			case "custom": {
				if (!options.emitter) {
					throw new TypeError(
						`The listener '${this.name}' declares 'type: "custom"' but was given no 'emitter' to attach to.`,
					);
				}

				return options.emitter as EventEmitter;
			}
			default:
				return this.container.client as unknown as EventEmitter;
		}
	}

	/**
	 * Invokes {@link Listener.run}, routing a thrown error to the framework's listener-error event
	 * rather than letting it become an unhandled rejection.
	 */
	private async invoke(...args: unknown[]) {
		const outcome = await Result.fromAsync(() =>
			this.run(...(args as EventArgs<Type, Event>)),
		);
		// The payload accepts a listener of any source; `this` is narrowed to one, which is a subtype.
		outcome.inspectErr((error) =>
			this.container.client.emit(Events.ListenerError, error, {
				piece: this as AnyListener,
			}),
		);
	}

	/**
	 * Invokes {@link Listener.run} once, then unloads the piece.
	 */
	private async invokeOnce(...args: unknown[]) {
		await this.invoke(...args);
		await this.unload();
	}
}
