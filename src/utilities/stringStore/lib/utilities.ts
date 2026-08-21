import type { TypedArray } from "@types";

/**
 * Converts a {@link TypedArray} to a string by reinterpreting its bytes as UTF-16 code units.
 *
 * @param buffer The typed array to convert.
 *
 * @since 1.0.0
 */
export function toUTF16(buffer: TypedArray): string {
	let result = "";
	for (const value of new Uint16Array(buffer.buffer)) {
		result += String.fromCharCode(value);
	}

	return result;
}

/**
 * Converts a string to a `Uint16Array` by reading each character's UTF-16 code unit directly.
 *
 * @param buffer The string to convert.
 *
 * @since 1.0.0
 */
export function fromUTF16(buffer: string): Uint16Array {
	const result = new Uint16Array(buffer.length);
	for (let index = 0; index < buffer.length; index++) {
		result[index] = buffer.charCodeAt(index);
	}

	return result;
}
