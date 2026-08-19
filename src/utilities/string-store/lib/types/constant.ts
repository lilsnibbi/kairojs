import type { IType } from "@types";

/**
 * Builds an {@link IType} that stores a fixed value without ever writing it to the buffer.
 *
 * Useful for attaching extra data to a schema's deserialized shape — a discriminant, a version
 * marker — without growing the serialized payload.
 *
 * @param constantValue The value every deserialization returns.
 *
 * @since 1.0.0
 */
export function ConstantType<const ValueType>(
	constantValue: ValueType,
): IType<ValueType, 0, never> {
	return {
		serialize() {},
		deserialize() {
			return constantValue;
		},
		BIT_SIZE: 0,
	};
}
