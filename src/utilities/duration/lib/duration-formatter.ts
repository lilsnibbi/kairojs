import type {
	DurationFormatAssetsTime,
	DurationFormatAssetsUnit,
	DurationFormatSeparators,
	TimeTypes,
} from "@types";
import {
	DEFAULT_SEPARATORS,
	DEFAULT_UNITS,
	TimeTypes as TimeTypesValues,
} from "./constants.ts";

/**
 * How many milliseconds each time unit spans, ordered from largest to smallest so
 * {@link DurationFormatter.format} can greedily consume the biggest units first.
 */
const kTimeDurations: readonly [TimeTypes, number][] = [
	[TimeTypesValues.Year, 31536000000],
	// 29.53059 days is the official duration of a month: https://en.wikipedia.org/wiki/Month
	[TimeTypesValues.Month, 2628000000],
	[TimeTypesValues.Week, 1000 * 60 * 60 * 24 * 7],
	[TimeTypesValues.Day, 1000 * 60 * 60 * 24],
	[TimeTypesValues.Hour, 1000 * 60 * 60],
	[TimeTypesValues.Minute, 1000 * 60],
	[TimeTypesValues.Second, 1000],
];

/**
 * Renders a millisecond duration as a human-readable string, e.g. `"3 days 2 hours"`.
 *
 * @since 1.0.0
 */
export class DurationFormatter {
	/**
	 * The unit names used when rendering a duration.
	 */
	public units: DurationFormatAssetsTime;

	/**
	 * @param units The unit names to render with.
	 *
	 * @default DEFAULT_UNITS
	 */
	public constructor(units: DurationFormatAssetsTime = DEFAULT_UNITS) {
		this.units = units;
	}

	/**
	 * Renders a millisecond duration as a human-readable string.
	 *
	 * @param duration The duration, in milliseconds, to render. Negative values are rendered with a
	 * leading `-` on the largest unit.
	 * @param precision The maximum number of units to include, largest first.
	 * @param separators The separators to place around and between the rendered units.
	 *
	 * @example
	 * ```typescript
	 * const formatter = new DurationFormatter();
	 * formatter.format(178_800_000);
	 * // "2 days and 1 hour"
	 * ```
	 */
	public format(
		duration: number,
		precision = 7,
		{
			left = DEFAULT_SEPARATORS.left,
			right = DEFAULT_SEPARATORS.right,
			final = DEFAULT_SEPARATORS.final,
		}: DurationFormatSeparators = DEFAULT_SEPARATORS,
	): string {
		const output: string[] = [];
		const negative = duration < 0;
		if (negative) duration *= -1;

		for (const [type, timeDuration] of kTimeDurations) {
			const division = duration / timeDuration;
			if (division < 1) continue;

			const floored = Math.floor(division);
			duration -= floored * timeDuration;
			output.push(addUnit(floored, this.units[type], left!));

			// Stop once the output has reached the requested precision.
			if (output.length >= precision) break;
		}

		if (output.length === 0)
			return addUnit(0, this.units[TimeTypesValues.Second], left!);
		if (negative) output[0] = `-${output[0]}`;

		if (output.length > 1) {
			const last = output.pop();
			return `${output.join(right!)}${final}${last}`;
		}

		return output.join(right!);
	}
}

/**
 * Renders a single unit's amount and name, e.g. `"3 days"`, choosing the exact-count name when one
 * exists and falling back to {@link DurationFormatAssetsUnit.DEFAULT} otherwise.
 *
 * @param time The amount of this unit to render.
 * @param unit The unit's language assets.
 * @param separator The separator placed between the amount and the name.
 */
function addUnit(
	time: number,
	unit: DurationFormatAssetsUnit,
	separator: string,
): string {
	if (Reflect.has(unit, time))
		return `${time}${separator}${Reflect.get(unit, time)}`;
	return `${time}${separator}${unit.DEFAULT}`;
}
