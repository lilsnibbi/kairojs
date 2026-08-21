import type { PieceLoaderContext } from "@types";
import type { ApplicationCommand, Collection, Snowflake } from "discord.js";
import { Events } from "@/constants/events.ts";
import { Listener } from "@/structures/listener.ts";

/**
 * Reports the result of a bulk overwrite, once per scope it was applied to.
 *
 * Bulk overwrite hands Discord the complete list of commands and lets it delete anything absent, so
 * the count that comes back is the authoritative answer to "what does the application have now" —
 * which is exactly what makes it worth logging.
 *
 * @since 1.0.0
 */
export class CoreApplicationCommandRegistriesBulkOverwriteListener extends Listener<
	"client",
	typeof Events.ApplicationCommandRegistriesBulkOverwrite
> {
	public constructor(context: PieceLoaderContext<"listeners">) {
		super(context, {
			type: "client",
			event: Events.ApplicationCommandRegistriesBulkOverwrite,
		});
	}

	public run(
		result: Collection<Snowflake, ApplicationCommand>,
		guildId: string | null,
	) {
		if (guildId) {
			this.container.logger.info(
				`ApplicationCommandRegistries(BulkOverwrite) Successfully overwrote guild application commands for guild ${guildId}. The application now has ${result.size} guild commands for guild ${guildId}`,
			);
		} else {
			this.container.logger.info(
				`ApplicationCommandRegistries(BulkOverwrite) Successfully overwrote global application commands. The application now has ${result.size} global commands`,
			);
		}
	}
}
