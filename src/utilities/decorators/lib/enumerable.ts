import { createMethodDecorator } from "./factories.ts";

/**
 * Controls whether a class field shows up in `Object.keys`, spreads, `JSON.stringify` and console
 * output.
 *
 * The field is replaced on the prototype by an accessor whose setter re-defines the property as a
 * plain own value with the requested enumerability, so the first assignment in the constructor is
 * what installs it on the instance. Hiding heavy or circular fields this way keeps a piece readable
 * when it is logged.
 *
 * @param value Whether the field should be enumerable.
 *
 * @example
 * ```typescript
 * import { Enumerable } from "kairojs/utilities/decorators";
 *
 * export class Session {
 *   @Enumerable(false)
 *   public token = "hunter2";
 *
 *   public name = "main";
 * }
 *
 * console.log({ ...new Session() }); // { name: "main" }
 * ```
 *
 * @since 1.0.0
 */
export function Enumerable(value: boolean) {
	return (target: object, key: string) => {
		Reflect.defineProperty(target, key, {
			enumerable: value,
			set(this: unknown, assigned: unknown) {
				Reflect.defineProperty(this as object, key, {
					configurable: true,
					enumerable: value,
					value: assigned,
					writable: true,
				});
			},
		});
	};
}

/**
 * Controls whether a class method shows up in `Object.keys` and in the output of a `for...in` over
 * the prototype.
 *
 * Methods are already non-enumerable by default, so this is mostly useful for the opposite: making
 * one deliberately visible.
 *
 * @param value Whether the method should be enumerable.
 *
 * @example
 * ```typescript
 * import { EnumerableMethod } from "kairojs/utilities/decorators";
 *
 * export class Session {
 *   @EnumerableMethod(true)
 *   public refresh() {
 *     return true;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function EnumerableMethod(value: boolean) {
	return createMethodDecorator((_target, _propertyKey, descriptor) => {
		descriptor.enumerable = value;
	});
}
