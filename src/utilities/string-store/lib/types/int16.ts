import type { IType } from "@types";

/**
 * A 16-bit signed integer, ranging from -32768 to 32767 inclusive.
 *
 * @since 1.0.0
 */
export const Int16Type: IType<number, 16> = {
	serialize(buffer, value) {
		buffer.writeInt16(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt16(pointer);
	},
	BIT_SIZE: 16,
};
