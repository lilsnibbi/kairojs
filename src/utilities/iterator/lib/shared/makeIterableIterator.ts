/**
 * Wraps a bare `next` function into a full {@link IterableIterator}, adding the
 * `Symbol.iterator` method that returns the wrapper itself.
 *
 * Many helpers build their result by hand-rolling a `next` closure rather than using a generator
 * function (usually because they need to peek ahead or buffer values); this turns that closure
 * into something that can be used in a `for...of` loop or spread.
 *
 * @param next The iterator protocol's `next` method.
 * @returns An iterable iterator backed by `next`.
 *
 * @internal
 */
export function makeIterableIterator<const ElementType>(
	next: Iterator<ElementType>["next"],
): IterableIterator<ElementType> {
	return {
		next,
		[Symbol.iterator]() {
			return this;
		},
	};
}
