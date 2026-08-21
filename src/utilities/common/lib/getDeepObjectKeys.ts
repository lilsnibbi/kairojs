import type { GetDeepObjectKeysOptions } from "@types";
import { isNullOrUndefinedOrEmpty } from "./isNullOrUndefinedOrEmpty.ts";

/**
 * Flattens an object into a list of its keys, recursing into nested objects and arrays of
 * objects.
 *
 * By default nested array indices are rendered as `arrayKey.0.subKey`; set
 * `options.arrayKeysIndexStyle` to `"braces-with-dot"` for `arrayKey[0].subKey`, or `"braces"` for
 * `arrayKey[0]subKey`.
 *
 * @param object The object to deeply collect keys from.
 * @param options Controls how array indices are rendered in the resulting key paths.
 * @returns Every key path found in `object`.
 *
 * @since 1.0.0
 */
export function getDeepObjectKeys(
	object: object,
	options?: GetDeepObjectKeysOptions,
): string[] {
	return [...iterateObjectKeys(object, options)];
}

function* iterateObjectKeys(
	object: object,
	{ arrayKeysIndexStyle = "dotted" }: GetDeepObjectKeysOptions = {
		arrayKeysIndexStyle: "dotted",
	},
): Generator<string> {
	if (Array.isArray(object)) {
		for (const [index, value] of object.entries()) {
			yield* iterateArrayKeys(value, index, { arrayKeysIndexStyle });
		}
	} else {
		for (const [key, value] of Object.entries(object)) {
			yield* iterateKeysRecursive(value, `${key}`, { arrayKeysIndexStyle });
		}
	}
}

function* iterateArrayKeys(
	value: unknown,
	index: number,
	{ arrayKeysIndexStyle }: GetDeepObjectKeysOptions,
): Generator<string> {
	const resolvedIndex =
		arrayKeysIndexStyle === "dotted"
			? `${index}`
			: arrayKeysIndexStyle === "braces"
				? `[${index}]`
				: `[${index}].`;
	yield* iterateKeysRecursive(value, resolvedIndex, { arrayKeysIndexStyle });
}

function* iterateKeysRecursive(
	value: unknown,
	prefix: string,
	{ arrayKeysIndexStyle }: GetDeepObjectKeysOptions,
): Generator<string> {
	if (typeof value !== "object" || value === null) {
		yield prefix;
		return;
	}

	if (Array.isArray(value)) {
		for (const [index, element] of value.entries()) {
			const resolvedPrefixedIndex =
				arrayKeysIndexStyle === "dotted"
					? `${prefix}.${index}`
					: `${prefix}[${index}]`;

			yield* iterateKeysRecursive(element, resolvedPrefixedIndex, {
				arrayKeysIndexStyle,
			});
		}
	} else {
		const entries = Object.entries(value);
		if (isNullOrUndefinedOrEmpty(entries) && prefix) {
			yield prefix;
		} else {
			for (const [key, entryValue] of entries) {
				yield* iterateKeysRecursive(
					entryValue,
					arrayKeysIndexStyle === "braces"
						? `${prefix}${key}`
						: `${prefix}.${key}`,
					{
						arrayKeysIndexStyle,
					},
				);
			}
		}
	}
}
