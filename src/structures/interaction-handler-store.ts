import type { Interaction } from "discord.js";
import type { InteractionHandlerOptions, None, Some } from "@types";
import { Result } from "@utilities/result/index.ts";
import { Events } from "@/constants/events.ts";
import { Store } from "@/loader/store.ts";
import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "./interaction-handler.ts";

/**
 * Decides which interactions each handler kind is offered.
 *
 * Kept as a `Map` rather than a `switch` so a bot can register a filter for a component kind Kairo
 * does not know about yet; a kind with no entry here is simply never offered anything.
 *
 * @since 1.0.0
 */
export const InteractionHandlerFilters = new Map<
	InteractionHandlerOptions["interactionHandlerType"],
	(interaction: Interaction) => boolean
>([
	[InteractionHandlerTypes.Button, (interaction) => interaction.isButton()],
	[
		InteractionHandlerTypes.SelectMenu,
		(interaction) => interaction.isAnySelectMenu(),
	],
	[
		InteractionHandlerTypes.ModalSubmit,
		(interaction) => interaction.isModalSubmit(),
	],
	[
		InteractionHandlerTypes.MessageComponent,
		(interaction) => interaction.isMessageComponent(),
	],
	[
		InteractionHandlerTypes.Autocomplete,
		(interaction) => interaction.isAutocomplete(),
	],
]);

/**
 * The store holding every {@link InteractionHandler} the bot has loaded.
 *
 * @since 1.0.0
 */
export class InteractionHandlerStore extends Store<
	InteractionHandler,
	"interaction-handlers"
> {
	public constructor() {
		super(InteractionHandler, { name: "interaction-handlers" });
	}

	/**
	 * Offers an interaction to every handler registered for its kind.
	 *
	 * Each handler's `parse` is awaited in turn, because a handler may need to look something up
	 * before it can say whether the interaction is its business. The `run` calls that follow are not:
	 * they are collected and awaited together, so two handlers claiming the same interaction do not
	 * queue behind one another.
	 *
	 * Nothing here throws. A `parse` that throws is reported and its handler skipped, and a `run`
	 * that throws is reported once every other handler has finished — one broken handler must not
	 * take the rest down with it.
	 *
	 * @param interaction The interaction to dispatch.
	 * @returns Whether any handler claimed the interaction.
	 */
	public async run(interaction: Interaction) {
		// Nothing is loaded, so there is nothing to offer it to.
		if (this.size === 0) return false;

		const pending: Promise<
			Result<unknown, { handler: InteractionHandler; error: unknown }>
		>[] = [];

		for (const handler of this.values()) {
			const filter = InteractionHandlerFilters.get(
				handler.interactionHandlerType,
			);

			// Either the kind is one we have no filter for, or this interaction is not of that kind.
			if (!filter?.(interaction)) continue;

			const parsed = await Result.fromAsync(() => handler.parse(interaction));
			parsed.match({
				ok: (option) => {
					this.container.client.emit(
						Events.InteractionHandlerParseSuccess,
						option,
						{ interaction, handler },
					);

					option.match({
						some: (value) => {
							this.container.client.emit(
								Events.InteractionHandlerParseSome,
								option as Some<typeof value>,
								{
									interaction,
									handler,
									value,
								},
							);

							pending.push(
								Result.fromAsync(() => handler.run(interaction, value)) //
									.then((outcome) =>
										outcome.mapErr((error) => ({ handler, error })),
									),
							);
						},
						none: () =>
							this.container.client.emit(
								Events.InteractionHandlerParseNone,
								option as None,
								{ interaction, handler },
							),
					});
				},
				err: (error) => {
					this.container.client.emit(
						Events.InteractionHandlerParseError,
						error,
						{ interaction, handler },
					);
				},
			});
		}

		// Every handler passed on it.
		if (pending.length === 0) return false;

		for (const outcome of await Promise.allSettled(pending)) {
			// `Result.fromAsync` captures rejections, so a settled promise is always fulfilled.
			if (outcome.status !== "fulfilled") continue;

			outcome.value.inspectErr(({ error, handler }) =>
				this.container.client.emit(Events.InteractionHandlerError, error, {
					interaction,
					handler,
				}),
			);
		}

		return true;
	}
}
