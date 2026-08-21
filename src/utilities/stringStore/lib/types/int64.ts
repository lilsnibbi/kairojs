import type { IType } from "@types";

/**
 * A 64-bit signed integer, given and returned as a `number`.
 *
 * @remarks
 * The nominal range is -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807, but values
 * outside `Number.MIN_SAFE_INTEGER`..`Number.MAX_SAFE_INTEGER` may lose precision.
 *
 * @see {@link BigInt64Type} for a variant that preserves full precision via `bigint`.
 *
 * @since 1.0.0
 */
export const Int64Type: IType<number, 64> = {
	serialize(buffer, value) {
		buffer.writeInt64(value);
	},
	deserialize(buffer, pointer) {
		return buffer.readInt64(pointer);
	},
	BIT_SIZE: 64,
};
