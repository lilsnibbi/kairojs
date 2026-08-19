const primitiveTypeNames = ["string", "bigint", "number", "boolean"];

/**
 * Checks whether a value is a primitive: a `string`, `bigint`, `number`, or `boolean`.
 *
 * @param input The value to check.
 *
 * @since 1.0.0
 */
export function isPrimitive(
	input: unknown,
): input is string | bigint | number | boolean {
	return primitiveTypeNames.includes(typeof input);
}
