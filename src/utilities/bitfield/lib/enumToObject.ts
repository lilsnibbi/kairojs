/**
 * Converts a TypeScript numeric enum object into a one-way object, stripping out the reverse
 * number-to-name lookup keys that `enum` compiles in.
 *
 * @param enumObject The enum object to convert.
 * @returns A copy of `enumObject` containing only its forward, name-to-value entries.
 *
 * @example
 * ```typescript
 * enum Permissions {
 * 	Read = 1 << 0,
 * 	Write = 1 << 1
 * }
 * // Permissions is really:
 * // { Read: 1, Write: 2, 1: "Read", 2: "Write" }
 *
 * enumToObject(Permissions);
 * // { Read: 1, Write: 2 }
 * ```
 *
 * @since 1.0.0
 */
export function enumToObject<T extends object>(
	enumObject: T,
): { [K in Exclude<keyof T, `${number}`>]: T[K] } {
	const result = {} as { [K in Exclude<keyof T, `${number}`>]: T[K] };
	for (const [key, value] of Object.entries(enumObject)) {
		if (Number.isNaN(Number(key)))
			result[key as Exclude<keyof T, `${number}`>] = value;
	}

	return result;
}
