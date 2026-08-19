import type { IterableResolvable, ZipIterators } from "@types";
import { from } from "./from.ts";

/**
 * Zips several iterables together into one iterable of tuples — the inverse of {@link unzip}.
 *
 * The result stops as soon as any one of the source iterables is exhausted.
 *
 * @param iterables The iterables to zip together.
 * @returns A new iterable that yields the next value of each source iterable as a tuple.
 *
 * @example
 * ```typescript
 * console.log([...zip([1, 2, 3], ['a', 'b', 'c'], [true, false, true])]);
 * // Output: [
 * //   [1, 'a', true],
 * //   [2, 'b', false],
 * //   [3, 'c', true]
 * // ]
 * ```
 *
 * @since 1.0.0
 */
export function* zip<
	const Iterables extends readonly IterableResolvable<any>[],
>(...iterables: Iterables): ZipIterators<Iterables> {
	const resolvedIterables = iterables.map((iterable) => from(iterable));
	while (true) {
		const results: any[] = [];
		for (const resolvedIterable of resolvedIterables) {
			const result = resolvedIterable.next();
			if (result.done) return;

			results.push(result.value);
		}

		yield results as any;
	}
}
