import type { Constructor } from "@types";

/**
 * Checks whether a value is an object literal, or an instance of a given class.
 *
 * @param input The value to check.
 * @param constructorType The constructor `input` must have been created by. Defaults to `Object`,
 * matching only plain object literals. Pass any class here to check for instances of it instead.
 *
 * @since 1.0.0
 */
export function isObject(
	input: unknown,
	constructorType?: ObjectConstructor,
): input is object;
export function isObject<T extends Constructor<unknown>>(
	input: unknown,
	constructorType: T,
): input is InstanceType<T>;
export function isObject<T extends Constructor<unknown> = ObjectConstructor>(
	input: unknown,
	constructorType?: T,
): input is object {
	return typeof input === "object" && input
		? input.constructor === (constructorType ?? Object)
		: false;
}
