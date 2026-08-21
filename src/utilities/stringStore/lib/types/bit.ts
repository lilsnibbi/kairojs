import type { IType } from "@types";

/**
 * A single bit, serialized and deserialized as `0` or `1`.
 *
 * @since 1.0.0
 */
export const BitType: IType<0 | 1, 1, number> = {
	serialize(buffer, value) {
		buffer.writeBit(value & 0b1);
	},
	deserialize(buffer, pointer) {
		return buffer.readBit(pointer);
	},
	BIT_SIZE: 1,
};
