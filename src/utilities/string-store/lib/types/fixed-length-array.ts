import type { IType } from "@types";
import { isArrayLike } from "../shared/common.ts";

/**
 * Builds an {@link IType} that serializes an array of `type` whose length is fixed at
 * schema-definition time, so the length itself never needs to be written to the buffer.
 *
 * @see {@link ArrayType} for a variable-length array whose length is written alongside it.
 *
 * @param type The element type.
 * @param length The array's fixed length. Serializing an array of any other length throws.
 *
 * @since 1.0.0
 */
export function FixedLengthArrayType<
	ValueType,
	ValueBitSize extends number | null,
>(
	type: IType<ValueType, ValueBitSize>,
	length: number,
): IType<ValueType[], ValueBitSize extends null ? null : number> {
	return {
		serialize(buffer, values) {
			if (!isArrayLike(values) || values.length !== length) {
				throw new TypeError(
					`Expected array of length ${length}, got ${values.length}`,
				);
			}

			for (let index = 0; index < length; index++) {
				type.serialize(buffer, values[index]!);
			}
		},
		deserialize(buffer, pointer) {
			const value = [];
			for (let index = 0; index < length; index++) {
				value.push(type.deserialize(buffer, pointer));
			}
			return value;
		},
		BIT_SIZE: (typeof type.BIT_SIZE === "number"
			? type.BIT_SIZE * length
			: null) as ValueBitSize extends null ? null : number,
	};
}
