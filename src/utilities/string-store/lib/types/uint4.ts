import type { IType } from "@types";

/**
 * A 4-bit unsigned integer, ranging from 0 to 15 inclusive.
 *
 * @since 1.0.0
 */
export const Uint4Type: IType<number, 4> = {
	serialize(buffer, value) {
		buffer.writeInt4(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint4(pointer);
	},
	BIT_SIZE: 4,
};
