import type {
	BucketScope as BucketScopeConstant,
	CommandOptionsRunTypeEnum as CommandOptionsRunTypeConstant,
	CommandPreConditions as CommandPreConditionsConstant,
	CooldownLevel as CooldownLevelConstant,
	InternalRegistryAPIType as InternalRegistryAPITypeConstant,
	PluginHook as PluginHookConstant,
	RegisterBehavior as RegisterBehaviorConstant,
} from "@/constants/enums.ts";

/**
 * What a command's cooldown is counted against.
 *
 * @since 1.0.0
 */
export type CooldownLevel =
	(typeof CooldownLevelConstant)[keyof typeof CooldownLevelConstant];

/**
 * The points in the client's start-up a plugin can hook into.
 *
 * @since 1.0.0
 */
export type PluginHook =
	(typeof PluginHookConstant)[keyof typeof PluginHookConstant];

/**
 * How widely a cooldown bucket is shared.
 *
 * @since 1.0.0
 */
export type BucketScope =
	(typeof BucketScopeConstant)[keyof typeof BucketScopeConstant];

/**
 * What Kairo does when a locally defined application command differs from the registered one.
 *
 * @since 1.0.0
 */
export type RegisterBehavior =
	(typeof RegisterBehaviorConstant)[keyof typeof RegisterBehaviorConstant];

/**
 * Which kind of application command a registry entry describes.
 *
 * @internal
 * @since 1.0.0
 */
export type InternalRegistryAPIType =
	(typeof InternalRegistryAPITypeConstant)[keyof typeof InternalRegistryAPITypeConstant];

/**
 * The places a command may be allowed to run, as accepted by a command's `runIn` option.
 *
 * @since 1.0.0
 */
export type CommandOptionsRunType =
	(typeof CommandOptionsRunTypeConstant)[keyof typeof CommandOptionsRunTypeConstant];

/**
 * The preconditions Kairo attaches to a command on its behalf, derived from the command's options.
 *
 * @since 1.0.0
 */
export type CommandPreConditions =
	(typeof CommandPreConditionsConstant)[keyof typeof CommandPreConditionsConstant];
