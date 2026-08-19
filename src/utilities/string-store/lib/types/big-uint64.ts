import type { IType } from "@types";

/**
 * A 64-bit unsigned integer, given and returned as a `bigint`, ranging from 0n to
 * 18,446,744,073,709,551,615n inclusive.
 *
 * @since 1.0.0
 */
export const BigUint64Type: IType<bigint, 64> = {
	serialize(buffer, value) {
		buffer.writeBigInt64(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readBigUint64(pointer);
	},
	BIT_SIZE: 64,
};
