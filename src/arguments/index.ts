/**
 * Registers every argument Kairo ships with.
 *
 * Each module registers its own piece as a side effect of being imported, so this barrel exports
 * nothing — importing it once is what puts `args.pick("user")` and its siblings within reach of
 * every command, without the parsers having to live in the bot's own `arguments` directory.
 *
 * @since 1.0.0
 */

import "./boolean.ts";
import "./channel.ts";
import "./date.ts";
import "./dmChannel.ts";
import "./emoji.ts";
import "./enum.ts";
import "./float.ts";
import "./guild.ts";
import "./guildCategoryChannel.ts";
import "./guildChannel.ts";
import "./guildNewsChannel.ts";
import "./guildNewsThreadChannel.ts";
import "./guildPrivateThreadChannel.ts";
import "./guildPublicThreadChannel.ts";
import "./guildStageVoiceChannel.ts";
import "./guildTextChannel.ts";
import "./guildThreadChannel.ts";
import "./guildVoiceChannel.ts";
import "./hyperlink.ts";
import "./integer.ts";
import "./member.ts";
import "./message.ts";
import "./number.ts";
import "./partialDmChannel.ts";
import "./role.ts";
import "./string.ts";
import "./user.ts";
