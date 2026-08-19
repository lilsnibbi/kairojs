import type { IType } from "@types";
import { isArrayLike } from "../shared/common.ts";

/**
 * Builds an {@link IType} that serializes a variable-length array of `type`, writing its length
 * ahead of the elements themselves.
 *
 * @see {@link fixedLengthArray} for a length that is fixed at schema-definition time and never
 * written to the buffer.
 *
 * @param type The element type.
 *
 * @since 1.0.0
 */
export function ArrayType<ValueType, ValueBitSize extends number | null>(
	type: IType<ValueType, ValueBitSize>,
): IType<ValueType[], null> {
	return {
		serialize(buffer, values: readonly ValueType[]) {
			if (!isArrayLike(values)) {
				throw new TypeError(`Expected an array, got ${values}`);
			}

			buffer.writeInt16(values.length);
			for (const value of values) {
				type.serialize(buffer, value);
			}
		},
		deserialize(buffer, pointer) {
			const length = buffer.readUint16(pointer);
			const value = [];
			for (let index = 0; index < length; index++) {
				value.push(type.deserialize(buffer, pointer));
			}
			return value;
		},
		BIT_SIZE: null,
	};
}
