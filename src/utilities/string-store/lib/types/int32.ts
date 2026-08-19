import type { IType } from "@types";

/**
 * A 32-bit signed integer, ranging from -2,147,483,648 to 2,147,483,647 inclusive.
 *
 * @since 1.0.0
 */
export const Int32Type: IType<number, 32> = {
	serialize(buffer, value) {
		buffer.writeInt32(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt32(pointer);
	},
	BIT_SIZE: 32,
};
