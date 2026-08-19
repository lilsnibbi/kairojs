/**
 * The contiguous Unicode code point ranges used to pack a stored character into a single 16-bit
 * word, alongside the matching index range each one maps to.
 *
 * `UnalignedUint16Array` uses these ranges both ways: characters are mapped down to a compact
 * index when writing, and indices are mapped back up to their original code point when reading
 * back out as a string. The three ranges cover the CJK Unified Ideographs, Tangut and
 * Supplementary Ideographic Plane blocks — chosen because they are large, contiguous, and rarely
 * appear in application data, making them safe to repurpose as an index space.
 *
 * @since 1.0.0
 */
export const codepointRanges = [
	{
		start: 0x4e00,
		end: 0x9ffc,
		indexStart: 0,
		indexEnd: 20988,
	},
	{
		start: 0x17000,
		end: 0x187f7,
		indexStart: 20989,
		indexEnd: 27125,
	},
	{
		start: 0x20000,
		end: 0x2960a,
		indexStart: 27126,
		indexEnd: 65536,
	},
];
