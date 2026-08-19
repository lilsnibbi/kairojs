import type { Constructor, TypedArray } from "@types";
import { isPrimitive } from "./is-primitive.ts";

/**
 * The shared prototype every typed array (`Uint8Array`, `Int32Array`, ...) inherits from. Cached
 * once so {@link deepClone} does not repeat the `Object.getPrototypeOf` lookup on every call.
 */
const typedArrayPrototype = Object.getPrototypeOf(
	Uint8Array,
) as Constructor<TypedArray>;

/**
 * Deep clones a value: primitives are returned as-is, and `Date`s, typed arrays, `Array`s,
 * `Map`s, `Set`s and plain objects are recreated recursively so the clone shares no mutable state
 * with the source.
 *
 * @param source The value to clone.
 * @returns A deep copy of `source`, or `source` itself when it is a primitive.
 *
 * @since 1.0.0
 */
export function deepClone<T>(source: T): T {
	if (source === null || isPrimitive(source)) {
		return source;
	}

	if (source instanceof Date) {
		return new (source.constructor as DateConstructor)(source) as unknown as T;
	}

	if (source instanceof typedArrayPrototype) {
		return (source.constructor as Uint8ArrayConstructor).from(
			source as Uint8Array,
		) as unknown as T;
	}

	if (Array.isArray(source)) {
		const output = new (source.constructor as ArrayConstructor)(
			source.length,
		) as unknown as T & (T extends (infer S)[] ? S[] : never);

		for (let index = 0; index < source.length; index++) {
			output[index] = deepClone(source[index]);
		}

		return output as unknown as T;
	}

	if (source instanceof Map) {
		const output = new (
			source.constructor as MapConstructor
		)() as unknown as T & (T extends Map<infer K, infer V> ? Map<K, V> : never);

		for (const [key, value] of source.entries()) {
			output.set(key, deepClone(value));
		}

		return output as unknown as T;
	}

	if (source instanceof Set) {
		const output = new (
			source.constructor as SetConstructor
		)() as unknown as T & (T extends Set<infer K> ? Set<K> : never);

		for (const value of source.values()) {
			output.add(deepClone(value));
		}

		return output as unknown as T;
	}

	if (typeof source === "object") {
		const output = new (
			(source as T & (object | Record<PropertyKey, unknown>))
				.constructor as ObjectConstructor
		)() as unknown as Record<PropertyKey, unknown>;

		for (const [key, value] of Object.entries(source)) {
			Object.defineProperty(output, key, {
				configurable: true,
				enumerable: true,
				value: deepClone(value),
				writable: true,
			});
		}

		return output as unknown as T;
	}

	return source;
}
