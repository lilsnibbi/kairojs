import { range } from "@utilities/utilities/index.ts";
import {
	allowedNum,
	cronTokens,
	partRegex,
	predefined,
	Time,
	tokensRegex,
	wildcardRegex,
} from "./constants.ts";

/**
 * Parses a 5-field cron pattern and computes the dates it matches.
 *
 * @see {@link https://en.wikipedia.org/wiki/Cron} for the pattern format this class implements.
 *
 * @since 1.0.0
 */
export class Cron {
	/**
	 * The pattern this instance was constructed with, lower-cased.
	 */
	public cron: string;

	/**
	 * {@link Cron.cron}, with `@`-shorthands, name tokens and random wildcards expanded into a plain
	 * 5-field pattern.
	 */
	public normalized: string;

	/**
	 * Every minute (0-59) this pattern matches.
	 */
	public minutes: number[];

	/**
	 * Every hour (0-23) this pattern matches.
	 */
	public hours: number[];

	/**
	 * Every day of the month (1-31) this pattern matches.
	 */
	public days: number[];

	/**
	 * Every month (1-12) this pattern matches.
	 */
	public months: number[];

	/**
	 * Every day of the week (0-6, Sunday first) this pattern matches.
	 */
	public dows: number[];

	/**
	 * @param cron The cron pattern to parse.
	 */
	public constructor(cron: string) {
		this.cron = cron.toLowerCase();
		this.normalized = Cron.normalize(this.cron);
		[this.minutes, this.hours, this.days, this.months, this.dows] =
			Cron.parseString(this.normalized);
	}

	/**
	 * Finds the next date, in UTC, that matches this pattern.
	 *
	 * @param outset The date to search forward from.
	 * @param origin Whether this call is the original (non-recursive) call — internal recursion uses
	 * this to know it can stop looking for a minute/hour match and just take the pattern's first one.
	 */
	public next(outset: Date = new Date(), origin = true): Date {
		if (
			!this.days.includes(outset.getUTCDate()) ||
			!this.months.includes(outset.getUTCMonth() + 1) ||
			!this.dows.includes(outset.getUTCDay())
		) {
			return this.next(new Date(outset.getTime() + Time.Day), false);
		}
		if (!origin)
			return new Date(
				Date.UTC(
					outset.getUTCFullYear(),
					outset.getUTCMonth(),
					outset.getUTCDate(),
					this.hours[0]!,
					this.minutes[0]!,
				),
			);

		const now = new Date(outset.getTime() + 60000);

		for (const hour of this.hours) {
			if (hour < now.getUTCHours()) continue;
			for (const minute of this.minutes) {
				if (hour === now.getUTCHours() && minute < now.getUTCMinutes())
					continue;
				return new Date(
					Date.UTC(
						outset.getUTCFullYear(),
						outset.getUTCMonth(),
						outset.getUTCDate(),
						hour,
						minute,
					),
				);
			}
		}

		return this.next(new Date(outset.getTime() + Time.Day), false);
	}

	/**
	 * Returns the pattern this instance was constructed with.
	 */
	public toString(): string {
		return this.cron;
	}

	/**
	 * Expands `@`-shorthands, name tokens (`jan`, `mon`, …) and random wildcards (`h`, `?`) into a
	 * plain 5-field numeric pattern.
	 *
	 * @param cron The pattern to normalize.
	 */
	private static normalize(cron: string): string {
		if (Reflect.has(predefined, cron)) return Reflect.get(predefined, cron);

		const now = new Date();
		const expanded = cron
			.split(" ")
			.map((part, index) =>
				part.replace(wildcardRegex, (match) => {
					if (match === "h")
						return (
							Math.floor(Math.random() * allowedNum[index]![1]!) +
							allowedNum[index]![0]!
						).toString();

					if (match === "?") {
						switch (index) {
							case 0:
								return now.getUTCMinutes().toString();
							case 1:
								return now.getUTCHours().toString();
							case 2:
								return now.getUTCDate().toString();
							case 3:
								return now.getUTCMonth().toString();
							case 4:
								return now.getUTCDay().toString();
						}
					}

					return match;
				}),
			)
			.join(" ");

		return expanded.replace(tokensRegex, (match) =>
			String(Reflect.get(cronTokens, match)),
		);
	}

	/**
	 * Parses every field of a normalized pattern.
	 *
	 * @param cron The normalized pattern to parse.
	 */
	private static parseString(
		cron: string,
	): [number[], number[], number[], number[], number[]] {
		const parts = cron.split(" ");
		if (parts.length !== 5) throw new Error("Invalid Cron Provided");
		return parts.map((part, index) => Cron.parsePart(part, index)) as [
			number[],
			number[],
			number[],
			number[],
			number[],
		];
	}

	/**
	 * Parses a single field of a normalized pattern into the list of values it matches.
	 *
	 * @param cronPart The field to parse.
	 * @param id The field's index — `0` for minutes through `4` for days of the week — used to look
	 * up its allowed range in {@link allowedNum}.
	 */
	private static parsePart(cronPart: string, id: number): number[] {
		if (cronPart.includes(",")) {
			const result: number[] = [];
			for (const part of cronPart.split(","))
				result.push(...Cron.parsePart(part, id));
			return [...new Set(result)].sort((a, b) => a - b);
		}

		const [, wild, minString, maxString, step] = partRegex.exec(cronPart)!;
		let [min, max] = [
			Number.parseInt(minString!, 10),
			Number.parseInt(maxString!, 10),
		];

		// If '*', set min and max as the minimum and maximum allowed numbers:
		if (wild) [min, max] = allowedNum[id]! as [number, number];
		// Else if a number was given, but not a maximum nor a step, return it as the only allowed value:
		else if (!max && !step) return [min];

		// Set min and max as the given numbers, defaulting max to the maximum allowed, so min is
		// never bigger than max. This makes min and max be, in the following cases (considering minutes):
		// -> 1-2 | 1..2
		// -> 2-1 | 1..2
		// -> 1/7 | 1, 8, 15, 22, 29, 36, 43, 50, 57
		[min, max] = ([min, max || allowedNum[id]![1]!] as [number, number]).sort(
			(a, b) => a - b,
		) as [number, number];

		return range(min, max, Number.parseInt(step!, 10) || 1);
	}
}
