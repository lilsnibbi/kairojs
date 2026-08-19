# kairojs

An object-oriented Discord bot framework for the [Bun](https://bun.com) runtime, built on top of [discord.js](https://discord.js.org).

Kairo ships as raw TypeScript. There is no build step and no compiled `dist/` — Bun runs the framework's source directly, so what you read in `node_modules/kairojs/src` is exactly what executes.

## Requirements

- Bun `>= 1.3.14`
- `discord.js` `^14.24.2` (peer dependency)
- `i18next` `^26.3.6` (optional peer dependency, only needed for `kairojs/i18n`)

## Install

```bash
bun add kairojs discord.js
```

## Quick start

Kairo discovers *pieces* — commands, listeners, preconditions and the rest — from directories next to your entrypoint. Start Bun with `src/index.ts` and the loader scans `src/commands`, `src/listeners` and so on:

```
my-bot
├─ src
│  ├─ commands
│  ├─ listeners
│  └─ index.ts
└─ package.json
```

```typescript
// src/index.ts
import { KairoClient } from "kairojs";
import { GatewayIntentBits } from "discord.js";

const client = new KairoClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  defaultPrefix: "!",
});

await client.login(process.env.DISCORD_TOKEN);
```

`login` discovers and loads every piece before it connects, so a bot is ready the moment it is online.

A command is a class in `src/commands`:

```typescript
// src/commands/ping.ts
import { Command } from "kairojs";
import type { ChatInputCommandInteraction } from "discord.js";
import type { ApplicationCommandRegistry, PieceLoaderContext } from "kairojs";

export class PingCommand extends Command {
  public constructor(context: PieceLoaderContext<"commands">) {
    super(context, { description: "Replies with pong." });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName("ping").setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Pong!");
  }
}
```

A listener is a class in `src/listeners`, and its event source alone determines which event names are valid and what arguments `run` receives:

```typescript
// src/listeners/ready.ts
import { Events, Listener } from "kairojs";
import type { Client } from "discord.js";
import type { PieceLoaderContext } from "kairojs";

export class ReadyListener extends Listener<"client", typeof Events.ClientReady> {
  public constructor(context: PieceLoaderContext<"listeners">) {
    super(context, { type: "client", event: Events.ClientReady, once: true });
  }

  public run(client: Client<true>) {
    this.container.logger.info(`Logged in as ${client.user.tag}`);
  }
}
```

## Pieces

Each store maps to one directory under the project root:

| Directory              | Structure            | What it does                                                        |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| `commands`             | `Command`            | Chat input, context menu and message commands, plus `Subcommand`      |
| `listeners`            | `Listener`           | Client, REST and custom events                                        |
| `preconditions`        | `Precondition`       | Reusable checks that gate a command before it runs                    |
| `arguments`            | `Argument`           | Named argument parsers for message commands                           |
| `interaction-handlers` | `InteractionHandler` | Buttons, select menus, modals and autocomplete                        |
| `pattern-commands`     | `PatternCommand`     | Commands matched by a pattern rather than a name                      |
| `utilities`            | `Utility`            | Your own helpers, reachable from anywhere through the container       |

Every piece can reach shared state through `container` — the client, the logger, the stores and anything a plugin or utility adds to it:

```typescript
import { container } from "kairojs";

container.logger.info(container.client.user?.tag);
```

## Exports

| Entry point                | Contents                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `kairojs`                  | The client, container, piece structures, loader, errors, constants, args  |
| `kairojs/i18n`             | `I18nPlugin`, `resolveKey`, `fetchT` and the `i18next` backend            |
| `kairojs/hmr`              | `HmrPlugin` and hot reloading for pieces during development               |
| `kairojs/logger`           | The default logger and its log levels                                     |
| `kairojs/utilities/*`      | Standalone utilities, imported one at a time                              |

Runtime values come from the source tree; types are published separately from the hand-written `@types` tree that `package.json`'s `types` field points at. A source file never exports a type, so import them explicitly:

```typescript
import { Command, KairoClient, container } from "kairojs";
import type { CommandOptions } from "kairojs";
```

### Utilities

`async-queue`, `bitfield`, `cron`, `decorators`, `discord-utilities`, `discord.js-utilities`, `duration`, `event-iterator`, `fetch`, `fs-utilities`, `iterator-utilities`, `lexure`, `phisherman`, `ratelimits`, `result`, `snowflake`, `stopwatch`, `string-store`, `time-utilities`, `timer-manager`, `timestamp`, `utilities`.

```typescript
import { Duration } from "kairojs/utilities/duration";
import { Result } from "kairojs/utilities/result";
```

## Internationalisation

`kairojs/i18n` is the only part of the framework that touches `i18next`, which is why it lives behind its own subpath and its own optional peer dependency. Register the plugin, put translations under `languages/<locale>/`, and use `resolveKey` or `fetchT` wherever you would otherwise hard-code English.

```bash
bun add i18next
```

## Hot module replacement

`kairojs/hmr` watches your piece directories and reloads pieces in place while the bot stays connected. Register `HmrPlugin` to have it follow the client lifecycle, or call `start` yourself once pieces are loaded.

## Development

```bash
bun install
bun test          # run the test suite
bun run typecheck # type check with the project's reporter
```

## Releasing

Pushing a `vMAJOR.MINOR.PATCH` tag runs `.github/workflows/publish.yml`, which checks the tag against `package.json`, type checks, tests, publishes to npm with `bun publish`, and opens a GitHub release.

```bash
git tag v10.1.0
git push origin v10.1.0
```

The workflow needs an `NPM_TOKEN` secret with publish rights, available to the `npm` environment.

## License

MIT © LilSnibbi & Contributors
