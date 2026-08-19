import type { IterableResolvable } from "@types";
import { makeIterableIterator } from "./shared/make-iterable-iterator.ts";
import { toIterableIterator } from "./to-iterable-iterator.ts";

/**
 * Wraps an iterator so that once it reports `done`, every later call also reports `done` —
 * regardless of what the underlying iterator would have done on its own.
 *
 * Some hand-written iterators can resume yielding values after a `done` result (for example one
 * that alternates between finite and infinite phases). This adapter pins the `done` state in
 * place the first time it is observed, which every helper in this package otherwise assumes.
 *
 * @param iterable The iterator to fuse.
 *
 * @example
 * ```typescript
 * const erratic = {
 *   state: 0,
 *   next() {
 *     const value = this.state++;
 *     return value % 2 === 0 ? { done: false, value } : { done: true, value: undefined };
 *   }
 * };
 *
 * const fused = fuse(erratic);
 * console.log(fused.next()); // { done: false, value: 0 }
 * console.log(fused.next()); // { done: true, value: undefined }
 * console.log(fused.next()); // { done: true, value: undefined } — stays done, even though
 * // the underlying iterator would have produced { done: false, value: 2 } next.
 * ```
 *
 * @since 1.0.0
 */
export function fuse<const ElementType>(
	iterable: IterableResolvable<ElementType>,
): IterableIterator<ElementType> {
	let ended = false;
	const iterator = toIterableIterator(iterable);
	return makeIterableIterator(() => {
		if (ended) {
			return { done: true, value: undefined };
		}

		const result = iterator.next();
		if (result.done) {
			ended = true;
		}

		return result;
	});
}
