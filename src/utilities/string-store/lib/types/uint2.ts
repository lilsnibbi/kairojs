import type { IType } from "@types";

/**
 * A 2-bit unsigned integer, ranging from 0 to 3 inclusive.
 *
 * @since 1.0.0
 */
export const Uint2Type: IType<number, 2> = {
	serialize(buffer, value) {
		buffer.writeInt2(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint2(pointer);
	},
	BIT_SIZE: 2,
};
