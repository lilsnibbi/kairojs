/**
 * The live end-to-end check for Phase 7.
 *
 * Everything up to the gateway is already covered by `tests/example-bot.test.ts`. This script covers
 * only what needs a real token and a real network:
 *
 * 1. Piece auto-discovery finds files on disk through the Bun glob walker, during a real `login()`.
 * 2. Application commands actually register against the Discord API, and can be read back.
 * 3. All three listener sources bind, and unbind again.
 * 4. `hmr` reloads an edited command **without dropping the gateway connection** — the reason hmr
 *    is kept at all, given `bun --hot` exists.
 *
 * It is a script rather than a `bun test` case on purpose: it needs credentials and network, so it
 * must never run as part of `bun test`.
 *
 * Usage — put the token in a `.env` file in the project root as `TOKEN` (or `DISCORD_TOKEN`);
 * Bun loads `.env` automatically:
 *
 * ```
 * TOKEN=your-bot-token
 * ```
 *
 * then run:
 *
 * ```
 * bun run scripts/live-check.ts
 * ```
 *
 * `.env` is already covered by `.gitignore`. Optionally set `DISCORD_TEST_GUILD_ID` to register the
 * command to one guild instead of globally, which propagates immediately.
 */
import { resolve } from "node:path";
import { GatewayIntentBits } from "discord.js";
import { KairoClient } from "@/client.ts";
import { Events } from "@/constants/events.ts";
import { container } from "@/container.ts";
import { RegisterBehavior } from "@/constants/enums.ts";
import {
	setDefaultBehaviorWhenNotIdentical,
	setDefaultGuildIds,
} from "@/application-commands/registries.ts";
import { deployEmitter } from "../tests/fixtures/example-bot/deploy-emitter.ts";

const token = process.env.TOKEN ?? process.env.DISCORD_TOKEN;
if (!token) {
	console.error(
		"No DISCORD_TOKEN found.\n\n" +
			"Create a .env file in the project root containing:\n\n" +
			"  DISCORD_TOKEN=your-bot-token\n\n" +
			"Bun loads .env automatically, and .gitignore already excludes it. Do not paste the token\n" +
			"into a chat or commit it.",
	);
	process.exit(1);
}

const root = resolve(import.meta.dir, "../tests/fixtures/example-bot");
const commandFile = resolve(root, "commands/ping.ts");
const originalSource = await Bun.file(commandFile).text();

const results: { name: string; ok: boolean; detail: string }[] = [];
function record(name: string, ok: boolean, detail = "") {
	results.push({ name, ok, detail });
	console.log(
		`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
	);
}

const guildId = process.env.DISCORD_TEST_GUILD_ID;
if (guildId) setDefaultGuildIds([guildId]);
setDefaultBehaviorWhenNotIdentical(RegisterBehavior.Overwrite);

const client = new KairoClient({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
	baseUserDirectory: root,
	loadMessageCommandListeners: true,
});

let restEventSeen = false;
client.rest.on("response", () => {
	restEventSeen = true;
});

/** Resolves when `event` fires, or rejects if it has not fired within `ms`. */
function waitFor(
	emitter: { once(event: string, listener: () => void): unknown },
	event: string,
	ms: number,
) {
	return new Promise<void>((resolvePromise, rejectPromise) => {
		const timer = setTimeout(
			() =>
				rejectPromise(
					new Error(`Timed out after ${ms}ms waiting for '${event}'.`),
				),
			ms,
		);
		emitter.once(event, () => {
			clearTimeout(timer);
			resolvePromise();
		});
	});
}

try {
	// `login()` resolves once the token is accepted and the handshake begins — the gateway is not
	// ready yet, and Kairo registers application commands from its own ready listener afterwards.
	// Both waits are armed before logging in so neither event can slip through the gap.
	const ready = waitFor(client, Events.ClientReady, 60_000);
	const registriesDone = waitFor(
		client,
		Events.ApplicationCommandRegistriesRegistered,
		60_000,
	);

	console.log("Logging in…\n");
	await client.login(token);
	await ready;
	await registriesDone;

	// --- 1. discovery happened during a real login -------------------------
	const commands = container.stores.get("commands");
	record(
		"piece discovery found the command during login()",
		commands.has("ping"),
		`${commands.size} command(s)`,
	);
	record(
		"piece discovery found the interaction handler",
		container.stores.get("interaction-handlers").has("button"),
	);
	record(
		"piece discovery found the precondition",
		container.stores.get("preconditions").has("OwnerOnly"),
	);

	// --- 2. the gateway is actually up -------------------------------------
	record(
		"gateway connected",
		client.isReady(),
		`logged in as ${client.user?.tag ?? "unknown"}`,
	);

	// --- 3. all three listener sources bound -------------------------------
	const listeners = container.stores.get("listeners");
	record(
		"client-source listener bound",
		listeners.get("interaction-create")?.emitter === (client as never),
	);
	// The `ready` listener is `once`, so firing it should have unloaded it again. That it is gone is
	// the proof `once` works end to end against a real gateway event.
	record(
		"a `once` listener unloaded itself after firing",
		!listeners.has("ready"),
	);
	record(
		"rest-source listener bound",
		listeners.get("rate-limited")?.emitter === (client.rest as never),
	);
	record(
		"custom-source listener bound",
		listeners.get("deploy-finished")?.emitter === (deployEmitter as never),
	);
	record(
		"rest manager emitted during login",
		restEventSeen,
		"proves the rest emitter is live, not just bound",
	);

	// a custom event really reaches its listener
	let customFired = false;
	const piece = listeners.get("deploy-finished")!;
	(piece as unknown as { run: (...args: unknown[]) => void }).run = () => {
		customFired = true;
	};
	deployEmitter.emit("deployFinished", "1.0.0", 1);
	await Bun.sleep(50);
	record("custom event reached its listener", customFired);

	// --- 4. application commands registered against the Discord API --------
	const application = client.application!;
	const manager = guildId ? application.commands : application.commands;
	const registered = await manager.fetch(guildId ? { guildId } : {});
	const ping = registered.find((entry) => entry.name === "ping");
	record(
		"application command registered against the Discord API",
		Boolean(ping),
		ping
			? `id ${ping.id}, scope ${guildId ? `guild ${guildId}` : "global"}`
			: "not found in the API response",
	);

	// --- 5. hmr reloads a command without dropping the gateway -------------
	const sessionBefore = client.ws.shards.map((shard) => shard.id).join(",");
	const readyAtBefore = client.readyTimestamp;
	const instanceBefore = commands.get("ping");

	await Bun.write(
		commandFile,
		originalSource.replace(
			'"Replies with a pong."',
			'"Replies with a pong. (edited)"',
		),
	);
	await instanceBefore!.reload();
	await Bun.sleep(100);

	const instanceAfter = commands.get("ping");
	record("hmr replaced the command instance", instanceAfter !== instanceBefore);
	record(
		"hmr picked up the edited source",
		instanceAfter?.description === "Replies with a pong. (edited)",
		instanceAfter?.description ?? "",
	);
	record(
		"gateway survived the reload",
		client.isReady() &&
			client.readyTimestamp === readyAtBefore &&
			client.ws.shards.map((s) => s.id).join(",") === sessionBefore,
		"same ready timestamp and shard set — no reconnect",
	);

	// --- 6. listeners unbind symmetrically ---------------------------------
	const boundBefore = deployEmitter.listenerCount("deployFinished");
	await piece.unload();
	record(
		"listener unbound on unload",
		boundBefore === 1 && deployEmitter.listenerCount("deployFinished") === 0,
	);
} catch (error) {
	record("live run completed without throwing", false, String(error));
	console.error(error);
} finally {
	await Bun.write(commandFile, originalSource);
	await client.destroy();
}

const failed = results.filter((entry) => !entry.ok);
console.log(
	`\n${results.length - failed.length}/${results.length} checks passed.`,
);
if (failed.length > 0) {
	console.log(
		`\nFailed:\n${failed.map((entry) => `  - ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`).join("\n")}`,
	);
	process.exit(1);
}

console.log("Live check clean.");
process.exit(0);
