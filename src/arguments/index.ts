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
import "./dm-channel.ts";
import "./emoji.ts";
import "./enum.ts";
import "./float.ts";
import "./guild.ts";
import "./guild-category-channel.ts";
import "./guild-channel.ts";
import "./guild-news-channel.ts";
import "./guild-news-thread-channel.ts";
import "./guild-private-thread-channel.ts";
import "./guild-public-thread-channel.ts";
import "./guild-stage-voice-channel.ts";
import "./guild-text-channel.ts";
import "./guild-thread-channel.ts";
import "./guild-voice-channel.ts";
import "./hyperlink.ts";
import "./integer.ts";
import "./member.ts";
import "./message.ts";
import "./number.ts";
import "./partial-dm-channel.ts";
import "./role.ts";
import "./string.ts";
import "./user.ts";
