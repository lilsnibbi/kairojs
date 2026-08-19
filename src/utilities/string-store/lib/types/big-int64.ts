import type { IType } from "@types";

/**
 * A 64-bit signed integer, given and returned as a `bigint`, ranging from
 * -9,223,372,036,854,775,808n to 9,223,372,036,854,775,807n inclusive.
 *
 * @since 1.0.0
 */
export const BigInt64Type: IType<bigint, 64> = {
	serialize(buffer, value) {
		buffer.writeBigInt64(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readBigInt64(pointer);
	},
	BIT_SIZE: 64,
};
