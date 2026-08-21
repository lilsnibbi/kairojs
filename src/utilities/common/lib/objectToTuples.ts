import { isObject } from "./isObject.ts";

/**
 * Flattens an object into `[key, value]` tuples, joining nested object keys with `.` into a single
 * dotted key rather than recursing into a nested tuple list.
 *
 * @param object The object to convert.
 * @param prefix The prefix prepended to every key, used internally while recursing.
 * @returns An array of `[key, value]` tuples.
 *
 * @since 1.0.0
 */
export function objectToTuples<T extends object>(
	object: T,
	prefix = "",
): [keyof T, T[keyof T]][] {
	const entries: [keyof T, T[keyof T]][] = [];

	for (const [key, value] of Object.entries(object)) {
		if (isObject(value)) {
			entries.push(...objectToTuples(value, `${prefix}${key}.`));
		} else {
			entries.push([`${prefix}${key}` as keyof T, value as T[keyof T]]);
		}
	}

	return entries;
}
