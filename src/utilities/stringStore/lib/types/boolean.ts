import type { IType } from "@types";

/**
 * A boolean, serialized as a single bit.
 *
 * @since 1.0.0
 */
export const BooleanType: IType<boolean, 1> = {
	serialize(buffer, value) {
		buffer.writeBit(Number(value));
	},
	deserialize(buffer, pointer) {
		return buffer.readBit(pointer) === 1;
	},
	BIT_SIZE: 1,
};
