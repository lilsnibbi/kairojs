/**
 * A predicate `EventIterator` runs against every value an emitter produces, deciding which ones
 * are actually handed to the consumer.
 *
 * @since 1.0.0
 */
export type EventIteratorFilter<V> = (value: V) => boolean;

/**
 * Options accepted by the `EventIterator` constructor.
 *
 * @since 1.0.0
 */
export interface EventIteratorOptions<V> {
	/**
	 * Only values this filter accepts are yielded; everything else is silently skipped.
	 */
	filter?: EventIteratorFilter<V>;

	/**
	 * How long, in milliseconds, the iterator may wait for a new value before ending itself.
	 */
	idle?: number;

	/**
	 * How many values may pass the filter before the iterator ends itself.
	 */
	limit?: number;
}
