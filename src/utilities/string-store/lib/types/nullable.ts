import type { IType } from "@types";

/**
 * Builds an {@link IType} that serializes `type` behind a presence bit, allowing `null` and
 * `undefined` to round-trip as `null`.
 *
 * @param type The underlying type, used only when a value is present.
 *
 * @since 1.0.0
 */
export function NullableType<ValueType, ValueBitSize extends number | null>(
	type: IType<ValueType, ValueBitSize>,
): IType<ValueType | null, null, ValueType | null | undefined> {
	return {
		serialize(buffer, value) {
			if (value === null || value === undefined) {
				buffer.writeBit(0);
			} else {
				buffer.writeBit(1);
				type.serialize(buffer, value);
			}
		},
		deserialize(buffer, pointer) {
			return buffer.readBit(pointer) ? type.deserialize(buffer, pointer) : null;
		},
		BIT_SIZE: null,
	};
}
