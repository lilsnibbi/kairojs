import type { IType } from "@types";

/**
 * A 2-bit signed integer, ranging from -2 to 1 inclusive.
 *
 * @since 1.0.0
 */
export const Int2Type: IType<number, 2> = {
	serialize(buffer, value) {
		buffer.writeInt2(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt2(pointer);
	},
	BIT_SIZE: 2,
};
