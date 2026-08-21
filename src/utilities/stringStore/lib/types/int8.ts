import type { IType } from "@types";

/**
 * An 8-bit signed integer, ranging from -128 to 127 inclusive.
 *
 * @since 1.0.0
 */
export const Int8Type: IType<number, 8> = {
	serialize(buffer, value) {
		buffer.writeInt8(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt8(pointer);
	},
	BIT_SIZE: 8,
};
