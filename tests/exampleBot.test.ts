import { describe, expect, test, beforeAll } from "bun:test";
import { resolve } from "node:path";
import { GatewayIntentBits } from "discord.js";
import { KairoClient } from "@/client.ts";
import { container } from "@/container.ts";
import { Events } from "@/constants/events.ts";
import { deployEmitter } from "./fixtures/exampleBot/deployEmitter.ts";

/**
 * Drives the real {@link KairoClient} against a realistic bot laid out on disk, covering everything
 * the framework does before a gateway connection is opened.
 *
 * The plan calls the loader rewrite the highest-risk change in the project, and the only thing that
 * genuinely exercises it is a real client discovering real pieces. Logging in needs a token and a
 * network, so this stops at `loadAll()` — which is exactly the work `login()` does before
 * `super.login()`, so everything up to the socket is covered here.
 */
describe("example bot", () => {
	const root = resolve(import.meta.dir, "fixtures/exampleBot");

	beforeAll(async () => {
		const client = new KairoClient({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
			// `registerPath` derives `<root>/<storeName>` per store, so pointing at the fixture root is
			// all that is needed for every store to find its folder.
			baseUserDirectory: root,
			loadMessageCommandListeners: true,
		});

		client.stores.registerPath(root);
		await Promise.all(
			[...client.stores.values()].map((store) => store.loadAll()),
		);
	});

	test("registers every built-in store", () => {
		expect([...container.stores.keys()].sort()).toEqual([
			"arguments",
			"commands",
			"interaction-handlers",
			"listeners",
			"pattern-commands",
			"preconditions",
			"utilities",
		]);
	});

	test("discovers the command and lowercases its name", () => {
		const commands = container.stores.get("commands");
		expect(commands.has("ping")).toBe(true);
		expect(commands.get("ping")!.name).toBe("ping");
	});

	test("resolves a command by its alias", () => {
		const commands = container.stores.get("commands");
		expect(commands.get("pong")).toBe(commands.get("ping")!);
	});

	test("detects both command entry points via the type guards", () => {
		const ping = container.stores.get("commands").get("ping")!;
		expect(ping.supportsMessageCommands()).toBe(true);
		expect(ping.supportsChatInputCommands()).toBe(true);
		expect(ping.supportsContextMenuCommands()).toBe(false);
	});

	test("builds the application command registry from registerApplicationCommands", () => {
		const ping = container.stores.get("commands").get("ping")!;
		expect(ping.applicationCommandRegistry.commandName).toBe("ping");
	});

	test("attaches the command's declared precondition", () => {
		const ping = container.stores.get("commands").get("ping")!;
		expect(JSON.stringify(ping.preconditions)).toContain("OwnerOnly");
	});

	test("discovers the fixture's precondition alongside the built-in ones", () => {
		const preconditions = container.stores.get("preconditions");
		expect(preconditions.has("OwnerOnly")).toBe(true);
		// The framework's own preconditions are registered as virtual pieces, so both kinds coexist.
		expect(preconditions.has("Cooldown")).toBe(true);
	});

	test("discovers the interaction handler under the kebab-case store name", () => {
		expect(container.stores.get("interaction-handlers").has("button")).toBe(
			true,
		);
	});

	test("binds all three listener sources to the right emitter", () => {
		const listeners = container.stores.get("listeners");
		const client = container.client;

		expect(listeners.get("ready")!.emitter).toBe(client as never);
		expect(listeners.get("rate-limited")!.emitter).toBe(client.rest as never);
		expect(listeners.get("deploy-finished")!.emitter).toBe(
			deployEmitter as never,
		);
	});

	test("actually attaches the listeners to their emitters", () => {
		const client = container.client;

		expect(client.listenerCount(Events.ClientReady)).toBeGreaterThan(0);
		expect(client.rest.listenerCount("rateLimited")).toBeGreaterThan(0);
		expect(deployEmitter.listenerCount("deployFinished")).toBe(1);
	});

	test("a custom-source listener receives its arguments when the event fires", async () => {
		const seen: unknown[] = [];
		const listener = container.stores.get("listeners").get("deploy-finished")!;
		// Swap the body rather than the registration, so the real bound callback is what runs.
		(listener as unknown as { run: (...args: unknown[]) => void }).run = (
			...args
		) => void seen.push(...args);

		deployEmitter.emit("deployFinished", "1.2.3", 450);
		await Bun.sleep(0);

		expect(seen).toEqual(["1.2.3", 450]);
	});

	test("unloading a listener detaches it from its emitter", async () => {
		const before = deployEmitter.listenerCount("deployFinished");
		await container.stores.get("listeners").get("deploy-finished")!.unload();

		expect(before).toBe(1);
		expect(deployEmitter.listenerCount("deployFinished")).toBe(0);
	});
});
