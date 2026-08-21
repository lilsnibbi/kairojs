import type { BitField } from "@utilities/bitField/index.ts";

/**
 * The primitive a {@link BitField} stores its bits as, derived from the widened type `T`.
 *
 * @since 1.0.0
 */
export type PrimitiveType<T> = T extends number ? number : bigint;

/**
 * Either a single `T`, or a readonly array of `T`.
 *
 * @since 1.0.0
 */
export type MaybeArray<T> = T | readonly T[];

/**
 * The primitive tag — `"number"` or `"bigint"` — that a {@link BitField}'s flags resolve to.
 *
 * @since 1.0.0
 */
export type BitFieldPrimitiveTag<Flags> = Flags[keyof Flags] extends number
	? "number"
	: "bigint";

/**
 * The zero value — `0` or `0n` — matching a {@link BitField}'s flag primitive.
 *
 * @since 1.0.0
 */
export type BitFieldZero<Flags> = Flags[keyof Flags] extends number ? 0 : 0n;

/**
 * Resolves the primitive type a {@link BitField} instance's fields are stored and returned as.
 *
 * @typeParam T A {@link BitField} instance type.
 *
 * @since 1.0.0
 */
export type ValueType<T> =
	T extends BitField<infer Flags> ? PrimitiveType<Flags[keyof Flags]> : never;

/**
 * Resolves every value a {@link BitField} instance's methods accept in place of a raw field.
 *
 * @typeParam T A {@link BitField} instance type.
 *
 * @since 1.0.0
 */
export type ValueResolvable<T> =
	T extends BitField<infer Flags>
		? MaybeArray<keyof Flags | PrimitiveType<Flags[keyof Flags]>>
		: never;
