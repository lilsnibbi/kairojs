import type { IterableResolvable, IterableResolved } from "@types";

/**
 * Resolves any {@link IterableResolvable} value into a raw {@link Iterator}.
 *
 * This is the entry point nearly every other helper in the package funnels through: it accepts a
 * plain iterable, an iterator, or something that is already both, and always hands back something
 * with a `next` method ready to call.
 *
 * @param value The value to convert to an iterator.
 * @returns The resolved iterator.
 *
 * @example
 * ```typescript
 * const iterator = from([1, 2, 3, 4, 5]);
 * for (const element of { [Symbol.iterator]: () => iterator }) {
 *   console.log(element);
 *   // Output: 1, 2, 3, 4, 5
 * }
 * ```
 *
 * @since 1.0.0
 */
export function from<
	const ElementType,
	const ResolvableType extends IterableResolvable<ElementType>,
>(value: ResolvableType): IterableResolved<ResolvableType>;
export function from(value: any) {
	if (typeof value === "object" && value !== null) {
		if (typeof value[Symbol.iterator] === "function") {
			return value[Symbol.iterator]();
		}

		if (typeof value.next === "function") {
			return value;
		}
	}

	if (typeof value === "string") {
		return value[Symbol.iterator]();
	}

	throw new TypeError(`${String(value)} cannot be converted to an iterable`);
}
