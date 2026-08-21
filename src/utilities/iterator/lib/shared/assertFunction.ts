/**
 * Guards a callback argument, throwing when it is not actually a function.
 *
 * Every helper that accepts a predicate or mapping callback runs it through this first so a bad
 * argument fails immediately at the call site instead of surfacing a confusing error deep inside
 * generator machinery.
 *
 * @param value The value that should be a callback function.
 * @returns `value`, unchanged, for convenient assignment at the call site.
 *
 * @internal
 */
export function assertFunction<Fn extends (...args: any[]) => any>(
	value: Fn,
): Fn {
	if (typeof value !== "function") {
		throw new TypeError(`${value} must be a function`);
	}

	return value;
}
