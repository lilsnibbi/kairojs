import { isObject } from "./is-object.ts";

/**
 * Deep merges a source object onto a target object: plain object values are merged recursively,
 * and every other value overwrites the target's existing value unless that existing value is
 * itself a plain object (in which case it is left untouched).
 *
 * @param target The object to merge into. Mutated in place.
 * @param source The object supplying the values to merge in.
 * @returns `target`, mutated to include `source`'s values.
 *
 * @since 1.0.0
 */
export function mergeObjects<A extends object, B extends object>(
	target: A,
	source: Readonly<B>,
): A & B {
	for (const [key, value] of Object.entries(source)) {
		const targetValue = Reflect.get(target, key);

		if (isObject(value)) {
			Reflect.set(
				target,
				key,
				isObject(targetValue)
					? mergeObjects(targetValue, value as object)
					: value,
			);
		} else if (!isObject(targetValue)) {
			Reflect.set(target, key, value);
		}
	}

	return target as A & B;
}
