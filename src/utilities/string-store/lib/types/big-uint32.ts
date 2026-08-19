import type { IType } from "@types";

/**
 * A 32-bit unsigned integer, given and returned as a `bigint`, ranging from 0n to
 * 4,294,967,295n inclusive.
 *
 * @since 1.0.0
 */
export const BigUint32Type: IType<bigint, 32> = {
	serialize(buffer, value) {
		buffer.writeBigInt32(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readBigUint32(pointer);
	},
	BIT_SIZE: 32,
};
