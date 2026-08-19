/**
 * Picks one random element from an array.
 *
 * @param array The array to pick from.
 *
 * @since 1.0.0
 */
export function pickRandom<T>(array: readonly T[], amount?: 1): T;
/**
 * Picks several random elements from an array, without repeats.
 *
 * @param array The array to pick from.
 * @param amount How many elements to pick.
 *
 * @since 1.0.0
 */
export function pickRandom<T>(array: readonly T[], amount: number): T[];
export function pickRandom<T>(array: readonly T[], amount = 1): T | T[] {
	const remaining = [...array];

	if (typeof amount === "undefined" || amount === 1) {
		return remaining[Math.floor(Math.random() * remaining.length)]!;
	}

	if (!remaining.length || !amount) {
		return [];
	}

	return Array.from(
		{ length: Math.min(amount, remaining.length) },
		() =>
			remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]!,
	);
}
