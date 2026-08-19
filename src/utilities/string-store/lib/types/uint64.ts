import type { IType } from "@types";

/**
 * A 64-bit unsigned integer, given and returned as a `number`.
 *
 * @remarks
 * The nominal range is 0 to 18,446,744,073,709,551,615, but values past
 * `Number.MAX_SAFE_INTEGER` may lose precision.
 *
 * @see {@link BigUint64Type} for a variant that preserves full precision via `bigint`.
 *
 * @since 1.0.0
 */
export const Uint64Type: IType<number, 64> = {
	serialize(buffer, value) {
		buffer.writeInt64(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readUint64(pointer);
	},
	BIT_SIZE: 64,
};
