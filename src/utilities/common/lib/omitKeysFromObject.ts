import { deepClone } from "./deepClone.ts";

/**
 * Deep clones an object via {@link deepClone} and then deletes the given keys from the clone,
 * leaving the source object untouched.
 *
 * @param source The object to omit keys from.
 * @param keys The keys to remove from the clone.
 * @returns A new object equal to `source` but without `keys`.
 *
 * @since 1.0.0
 */
export function omitKeysFromObject<
	SourceObject extends object,
	ObjectKeys extends keyof SourceObject,
>(
	source: SourceObject,
	...keys: readonly ObjectKeys[]
): Omit<SourceObject, ObjectKeys> {
	const clone = deepClone(source);

	for (const key of keys) {
		Reflect.deleteProperty(clone, key);
	}

	return clone;
}
