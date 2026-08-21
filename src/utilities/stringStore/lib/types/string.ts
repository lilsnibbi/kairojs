import type { IType } from "@types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * A UTF-8 encoded string, serialized as a byte length followed by its encoded bytes, each written
 * as an 8-bit integer.
 *
 * @since 1.0.0
 */
export const StringType: IType<string, null> = {
	serialize(buffer, value) {
		const encoded = encoder.encode(value);
		buffer.writeInt16(encoded.length);
		for (const byte of encoded) {
			buffer.writeInt8(byte);
		}
	},
	deserialize(buffer, pointer) {
		const length = buffer.readInt16(pointer);
		const bytes = new Uint8Array(length);
		for (let index = 0; index < length; index++) {
			bytes[index] = buffer.readInt8(pointer);
		}
		return decoder.decode(bytes);
	},
	BIT_SIZE: null,
};
