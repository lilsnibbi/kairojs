/**
 * Builds an array of numbers from `min` to `max` (inclusive), stepping by `step`.
 *
 * @param min The starting value.
 * @param max The value the range should not exceed.
 * @param step The increment between consecutive values.
 *
 * @since 1.0.0
 */
export function range(min: number, max: number, step: number): number[] {
	return new Array(Math.floor((max - min) / step) + 1)
		.fill(0)
		.map((_value, index) => min + index * step);
}
