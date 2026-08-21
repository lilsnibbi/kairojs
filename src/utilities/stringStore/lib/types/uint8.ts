import type { IType } from "@types";

/**
 * An 8-bit unsigned integer, ranging from 0 to 255 inclusive.
 *
 * @since 1.0.0
 */
export const Uint8Type: IType<number, 8> = {
	serialize(buffer, value) {
		buffer.writeInt8(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint8(pointer);
	},
	BIT_SIZE: 8,
};
