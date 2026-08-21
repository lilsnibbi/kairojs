import { Snowflake } from "./snowflake.ts";

/**
 * A {@link Snowflake} instance preconfigured with Discord's snowflake epoch, `2015-01-01T00:00:00.000Z`.
 *
 * @see {@link https://discord.com/developers/docs/reference#snowflakes} for Discord's snowflake format.
 *
 * @since 1.0.0
 */
export const DiscordSnowflake = new Snowflake(1420070400000n);
