/**
 * Anything that can be turned into an {@link Iterator} — a plain iterable, a raw iterator, or
 * something that is already both.
 *
 * Nearly every helper in the iterator-utilities package accepts this instead of a bare
 * `Iterable<T>` so that the output of one helper can be fed straight into the next without an
 * extra `[Symbol.iterator]` wrapper.
 *
 * @since 1.0.0
 */
export type IterableResolvable<ElementType> =
	| Iterable<ElementType>
	| Iterator<ElementType>
	| IterableIterator<ElementType>;

/**
 * The type produced by resolving a value of type `Type` with {@link from}.
 *
 * An `IterableIterator` resolves to itself, a plain `Iterable` resolves to its underlying
 * `Iterator`, and a plain `Iterator` resolves to itself.
 *
 * @since 1.0.0
 */
export type IterableResolved<Type> =
	Type extends IterableIterator<infer Output>
		? IterableIterator<Output>
		: Type extends Iterable<infer Output>
			? Iterator<Output>
			: Type extends Iterator<infer Output>
				? Iterator<Output>
				: never;

/**
 * The result of a lexicographic comparison between two sequences.
 *
 * Two iterators are compared element by element and the first pair of unequal elements decides
 * the result. A sequence that is a prefix of another is lexicographically less than it, and two
 * sequences with the same elements in the same order are lexicographically equal. An empty
 * sequence is less than any non-empty one, and two empty sequences are equal.
 *
 * @since 1.0.0
 */
export type LexicographicComparison = -1 | 0 | 1;

/**
 * A comparator used by the `*By` family of helpers (`compareBy`, `isSortedBy`, `maxBy`, `minBy`,
 * …). It receives two non-`undefined` elements and returns a negative, zero, or positive number
 * following the same contract as {@link Array.prototype.sort}'s compare function.
 *
 * @since 1.0.0
 */
export type CompareByComparator<ElementType> = (
	x: Exclude<ElementType, undefined>,
	y: Exclude<ElementType, undefined>,
) => number;

/**
 * Anything {@link Number} can coerce into a numeric value: a number, a boolean, `null`, or an
 * object implementing `valueOf` or `Symbol.toPrimitive`.
 *
 * @since 1.0.0
 */
export type NumberResolvable =
	| number
	| boolean
	| null
	| { valueOf(): number | boolean | null }
	| { [Symbol.toPrimitive](): number | boolean | null };

/**
 * An {@link IterableIterator} that can also report its next value without consuming it.
 *
 * @since 1.0.0
 */
export interface Peekable<T> extends IterableIterator<T> {
	/**
	 * Returns the next result without advancing the iterator. Calling `peek` repeatedly without an
	 * intervening `next` always returns the same result.
	 */
	peek(): IteratorResult<T>;
}

/**
 * The parameter list `starMap` calls its callback with for a given inner element type: the tuple
 * types of a fixed-length array/tuple are preserved, and any other iterable resolves to an array
 * of its element type.
 *
 * @since 1.0.0
 */
export type StarMapParameters<ElementType> = ElementType extends readonly [
	...infer ElementTypeEntry,
]
	? ElementTypeEntry
	: ElementType extends IterableResolvable<infer ElementType>
		? ElementType[]
		: never;

/**
 * The array-of-arrays shape produced by `unzip` for a given tuple element type — one array per
 * tuple position.
 *
 * @since 1.0.0
 */
export type UnzipIterable<ElementType extends readonly any[]> = {
	-readonly [P in keyof ElementType]: ElementType[P][];
};

/**
 * The iterable of tuples produced by `zip` for a given tuple of source iterables — each yielded
 * tuple pairs up the next value of every source in order.
 *
 * @since 1.0.0
 */
export type ZipIterators<Iterators extends readonly IterableResolvable<any>[]> =
	IterableIterator<{
		-readonly [P in keyof Iterators]: Iterators[P] extends IterableResolvable<
			infer T
		>
			? T
			: never;
	}>;
