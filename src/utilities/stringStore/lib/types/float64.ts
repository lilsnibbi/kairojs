import type { IType } from "@types";

/**
 * A 64-bit floating point number, ranging from -1.7976931348623157e+308 to
 * 1.7976931348623157e+308 inclusive.
 *
 * @since 1.0.0
 */
export const Float64Type: IType<number, 64> = {
	serialize(buffer, value) {
		buffer.writeFloat64(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readFloat64(pointer);
	},
	BIT_SIZE: 64,
};
