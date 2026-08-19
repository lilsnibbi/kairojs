import type { DeepRequired } from "@types";
import { deepClone } from "./deep-clone.ts";
import { isObject } from "./is-object.ts";

/**
 * Deep merges an overwrites object onto a base object: every key from `base` that is missing or
 * `undefined` in `overwrites` is filled in (deep cloned), and every nested object key is merged
 * recursively. `overwrites` itself is mutated and returned.
 *
 * @remarks A key explicitly set to `null` in `overwrites` is treated as a real value and is kept
 * as `null` rather than being replaced by the base's value.
 *
 * @param base The base object supplying defaults.
 * @param overwrites The object to fill in and return. Mutated in place.
 * @returns `overwrites`, now containing every key of `base` it did not already define.
 *
 * @example
 * ```typescript
 * const base = { a: 0, b: 1 };
 * mergeDefault(base, {}); // { a: 0, b: 1 }
 * mergeDefault(base, { a: 2, i: 3 }); // { a: 2, i: 3, b: 1 }
 * mergeDefault(base, { a: null }); // { a: null, b: 1 }
 * mergeDefault(base, { a: undefined }); // { a: 0, b: 1 }
 * mergeDefault({ a: null }, { a: { b: 5 } }); // { a: { b: 5 } }
 * ```
 *
 * @since 1.0.0
 */
export function mergeDefault<A extends object, B extends Partial<A>>(
	base: A,
	overwrites?: B,
): DeepRequired<A & B> {
	if (!overwrites) return deepClone(base) as DeepRequired<A & B>;

	for (const [baseKey, baseValue] of Object.entries(base)) {
		const overwriteValue = Reflect.get(overwrites, baseKey);

		if (typeof overwriteValue === "undefined") {
			Reflect.set(overwrites, baseKey, deepClone(baseValue));
		} else if (isObject(overwriteValue)) {
			Reflect.set(
				overwrites,
				baseKey,
				mergeDefault((baseValue ?? {}) as object, overwriteValue),
			);
		}
	}

	return overwrites as DeepRequired<A & B>;
}
