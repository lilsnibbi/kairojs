import type { IType } from "@types";

/**
 * A 32-bit signed integer, given and returned as a `bigint`, ranging from -2,147,483,648n to
 * 2,147,483,647n inclusive.
 *
 * @since 1.0.0
 */
export const BigInt32Type: IType<bigint, 32> = {
	serialize(buffer, value) {
		buffer.writeBigInt32(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readBigInt32(pointer);
	},
	BIT_SIZE: 32,
};
