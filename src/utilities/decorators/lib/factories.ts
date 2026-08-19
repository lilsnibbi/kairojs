import type { FunctionFallback, FunctionPrecondition } from "@types";

/**
 * Hands a method decorator straight back.
 *
 * Writing a method decorator inline means spelling out the types of all three parameters, because
 * there is nothing for TypeScript to infer them from. Passing the function through here supplies
 * that context, so `target`, `propertyKey` and `descriptor` are typed for free.
 *
 * @param decorator The decorator to type and return.
 *
 * @example
 * ```typescript
 * import { createMethodDecorator } from "kairojs/utilities/decorators";
 *
 * function enumerableMethod(value: boolean) {
 *   return createMethodDecorator((_target, _propertyKey, descriptor) => {
 *     descriptor.enumerable = value;
 *   });
 * }
 * ```
 *
 * @since 1.0.0
 */
export function createMethodDecorator(
	decorator: MethodDecorator,
): MethodDecorator {
	return decorator;
}

/**
 * Hands a class decorator straight back, giving its `target` parameter a type without forcing the
 * caller to satisfy the very loose built-in `ClassDecorator` signature.
 *
 * Returning a value from the wrapped function replaces the decorated class with it, which is how
 * {@link ApplyOptions} swaps a piece for a proxy of itself.
 *
 * @param decorator The decorator to type and return.
 *
 * @since 1.0.0
 */
export function createClassDecorator<
	Decorator extends (...args: any[]) => void,
>(decorator: Decorator): ClassDecorator {
	return decorator;
}

/**
 * Builds a method decorator that runs a check before the decorated method, and substitutes a
 * fallback result when the check says no.
 *
 * The wrapper is asynchronous whether or not the precondition is, so a decorated method always
 * returns a promise afterwards and its result has to be awaited. Both the precondition and the
 * fallback receive the method's own arguments; the fallback is additionally called with the same
 * `this`, so it can reach the instance.
 *
 * @param precondition Decides whether the method may run.
 * @param fallback Produces the result when the precondition answers falsily. Defaults to returning
 * `undefined`.
 *
 * @example
 * ```typescript
 * import { createFunctionPrecondition } from "kairojs/utilities/decorators";
 * import type { Message } from "discord.js";
 *
 * // Silently does nothing outside a guild.
 * function requireGuild() {
 *   return createFunctionPrecondition((message: Message) => message.guild !== null);
 * }
 *
 * // Replies instead of doing nothing.
 * function requireGuildOrComplain() {
 *   return createFunctionPrecondition(
 *     (message: Message) => message.guild !== null,
 *     (message: Message) => message.reply("That only works in a server.")
 *   );
 * }
 * ```
 *
 * @since 1.0.0
 */
export function createFunctionPrecondition(
	precondition: FunctionPrecondition,
	fallback: FunctionFallback = (): void => undefined,
): MethodDecorator {
	return createMethodDecorator((_target, _propertyKey, descriptor) => {
		const method = descriptor.value;
		if (!method)
			throw new Error(
				"Function preconditions require a descriptor carrying a value.",
			);
		if (typeof method !== "function")
			throw new Error(
				"Function preconditions can only be applied to functions.",
			);

		const guarded = method as (this: unknown, ...args: any[]) => unknown;

		descriptor.value = async function guardedMethod(
			this: unknown,
			...args: any[]
		) {
			const canRun = await precondition(...args);
			return canRun
				? guarded.call(this, ...args)
				: fallback.call(this, ...args);
		} as unknown as undefined;
	});
}

/**
 * Wraps an object in a proxy that can intercept construction without subclassing it.
 *
 * Every method read through the proxy is rebound to the original object, so a piece's static helpers
 * keep working on the real class rather than on the proxy. The `get` trap is reserved for exactly
 * that, which is why the handler this takes cannot supply one of its own.
 *
 * @param target The object to wrap — in practice, a class.
 * @param handler The traps to install alongside the built-in `get`.
 *
 * @internal
 * @since 1.0.0
 */
export function createProxy<Target extends object>(
	target: Target,
	handler: Omit<ProxyHandler<Target>, "get">,
): Target {
	return new Proxy(target, {
		...handler,
		get: (wrapped, property) => {
			const value = Reflect.get(wrapped, property);
			return typeof value === "function"
				? (...args: readonly unknown[]) => value.apply(wrapped, args)
				: value;
		},
	});
}
