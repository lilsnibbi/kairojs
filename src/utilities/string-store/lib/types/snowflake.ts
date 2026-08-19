import type { IType } from "@types";

/**
 * A Discord snowflake, stored as a 64-bit unsigned integer but accepted for serialization as
 * either a `bigint` or a numeric `string` — the form snowflakes usually arrive in.
 *
 * Equivalent to {@link BigUint64Type} except for the widened input type.
 *
 * @since 1.0.0
 */
export const SnowflakeType: IType<bigint, 64, bigint | string> = {
	serialize(buffer, value) {
		buffer.writeBigInt64(BigInt(value));
	},
	deserialize(buffer, pointer) {
		return buffer.readBigUint64(pointer);
	},
	BIT_SIZE: 64,
};
