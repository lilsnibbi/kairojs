import { AliasStore } from "@/loader/aliasStore.ts";
import { RegisterBehavior } from "@/constants/enums.ts";
import {
	allGuildIdsToFetchCommandsFor,
	getDefaultBehaviorWhenNotIdentical,
	handleBulkOverwrite,
	registries,
} from "@/applicationCommands/registries.ts";
import { getNeededRegistryParameters } from "@/applicationCommands/neededParameters.ts";
import { emitPerRegistryError } from "@/applicationCommands/registryErrors.ts";
import { Command } from "./command.ts";

/**
 * The store holding every {@link Command} the bot has loaded.
 *
 * On top of what an alias store already does for a command's own `aliases`, this one also keeps the
 * alias table pointing at each command's registered application commands — by name and by Discord's
 * ID — so an incoming interaction resolves to its command with a single lookup. Because commands are
 * stored under their lowercased name, so is everything looked up here.
 *
 * @since 1.0.0
 */
export class CommandStore extends AliasStore<Command, "commands"> {
	public constructor() {
		super(Command, { name: "commands" });
	}

	/**
	 * Every category the loaded commands sit in, with uncategorised commands ignored.
	 */
	public get categories(): string[] {
		const categories = new Set(this.map((command) => command.category));
		categories.delete(null);
		return [...categories] as string[];
	}

	/**
	 * Removes a command, along with its application-command aliases and its registry.
	 *
	 * @param name The command, or the name it is stored under.
	 * @returns The command that was removed.
	 */
	public override unload(name: string | Command) {
		const piece = this.resolve(name);

		// Another command may have claimed these names since; only drop the ones still ours.
		for (const nameOrId of piece.applicationCommandRegistry.chatInputCommands) {
			if (this.aliases.get(nameOrId) === piece) this.aliases.delete(nameOrId);
		}

		for (const nameOrId of piece.applicationCommandRegistry
			.contextMenuCommands) {
			if (this.aliases.get(nameOrId) === piece) this.aliases.delete(nameOrId);
		}

		registries.delete(piece.name);

		return super.unload(name);
	}

	/**
	 * Loads every command, then brings the application commands they declare in line with Discord.
	 *
	 * The registration half is skipped entirely when there is no application yet, which is the case
	 * on the first load — the client has not identified, so there is nothing to register against.
	 * Kairo runs this again after login.
	 */
	public override async loadAll() {
		await super.loadAll();

		// Called before login: there is no application to register anything with yet.
		if (!this.container.client.application) return;

		// Unloading the old pieces cleared their registries, so every command has to declare its
		// application commands again before the guild IDs to fetch for are known.
		for (const command of this.values()) {
			if (command.registerApplicationCommands) {
				try {
					await command.registerApplicationCommands(
						command.applicationCommandRegistry,
					);
				} catch (error) {
					emitPerRegistryError(error, command);
				}
			}
		}

		if (
			getDefaultBehaviorWhenNotIdentical() === RegisterBehavior.BulkOverwrite
		) {
			await handleBulkOverwrite(
				this,
				this.container.client.application.commands,
			);
			return;
		}

		const { applicationCommands, globalCommands, guildCommands } =
			await getNeededRegistryParameters(allGuildIdsToFetchCommandsFor);

		for (const command of this.values()) {
			await command.applicationCommandRegistry.runApiCalls(
				applicationCommands,
				globalCommands,
				guildCommands,
			);

			// Point the alias table at whatever names and IDs the command ended up registered under.
			for (const nameOrId of command.applicationCommandRegistry
				.chatInputCommands) {
				this.aliases.set(nameOrId, command);
			}

			for (const nameOrId of command.applicationCommandRegistry
				.contextMenuCommands) {
				this.aliases.set(nameOrId, command);
			}
		}
	}
}
