import type { IType } from "@types";

/**
 * A 16-bit unsigned integer, ranging from 0 to 65535 inclusive.
 *
 * @since 1.0.0
 */
export const Uint16Type: IType<number, 16> = {
	serialize(buffer, value) {
		buffer.writeInt16(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint16(pointer);
	},
	BIT_SIZE: 16,
};
