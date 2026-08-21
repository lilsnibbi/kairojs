import { Snowflake } from "./snowflake.ts";

/**
 * A {@link Snowflake} instance preconfigured with Twitter's snowflake epoch, `2010-11-04T01:42:54.657Z`.
 *
 * @see {@link https://github.com/twitter-archive/snowflake/blob/b3f6a3c6ca8e1b6847baa6ff42bf72201e2c2231/src/main/scala/com/twitter/service/snowflake/IdWorker.scala#L25}
 * for the archived reference implementation this epoch is taken from.
 *
 * @since 1.0.0
 */
export const TwitterSnowflake = new Snowflake(1288834974657n);
