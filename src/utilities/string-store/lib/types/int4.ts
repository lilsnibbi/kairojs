import type { IType } from "@types";

/**
 * A 4-bit signed integer, ranging from -8 to 7 inclusive.
 *
 * @since 1.0.0
 */
export const Int4Type: IType<number, 4> = {
	serialize(buffer, value) {
		buffer.writeInt4(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt4(pointer);
	},
	BIT_SIZE: 4,
};
