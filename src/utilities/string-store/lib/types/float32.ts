import type { IType } from "@types";

/**
 * A 32-bit floating point number, ranging from -3.4028234663852886e+38 to
 * 3.4028234663852886e+38 inclusive.
 *
 * @since 1.0.0
 */
export const Float32Type: IType<number, 32> = {
	serialize(buffer, value) {
		buffer.writeFloat32(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readFloat32(pointer);
	},
	BIT_SIZE: 32,
};
