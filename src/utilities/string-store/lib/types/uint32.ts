import type { IType } from "@types";

/**
 * A 32-bit unsigned integer, ranging from 0 to 4,294,967,295 inclusive.
 *
 * @since 1.0.0
 */
export const Uint32Type: IType<number, 32> = {
	serialize(buffer, value) {
		buffer.writeInt32(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint32(pointer);
	},
	BIT_SIZE: 32,
};
