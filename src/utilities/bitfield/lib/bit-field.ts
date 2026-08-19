import type {
	BitFieldPrimitiveTag,
	BitFieldZero,
	ValueResolvable,
	ValueType,
} from "@types";

/**
 * Wraps a plain object of named bit flags — numbers or bigints — and provides set-theoretic
 * operations (union, intersection, difference, …) over combinations of them.
 *
 * @typeParam Flags An object mapping flag names to either all-number or all-bigint values.
 *
 * @since 1.0.0
 */
export class BitField<
	Flags extends Record<string, number> | Record<string, bigint>,
> {
	/**
	 * Whether this instance's flags resolve to `number` or `bigint` values.
	 */
	public readonly type: BitFieldPrimitiveTag<Flags>;

	/**
	 * The empty field for this instance's primitive type — `0` or `0n`.
	 */
	public readonly zero: BitFieldZero<Flags>;

	/**
	 * The union of every flag's bits — the widest field this instance can produce.
	 */
	public readonly mask: ValueType<this>;

	/**
	 * The flags this instance was constructed with.
	 */
	public readonly flags: Flags;

	/**
	 * A cached, ordered snapshot of {@link BitField.flags}'s entries, used by the iteration helpers.
	 */
	readonly #flagEntries: readonly [string, Flags[keyof Flags]][];

	/**
	 * @param flags The named bit flags this instance operates over. Every value must be the same
	 * primitive type — either all `number` or all `bigint` — and strictly positive.
	 */
	public constructor(flags: Readonly<Flags>) {
		if (typeof flags !== "object" || flags === null) {
			throw new TypeError("flags must be a non-null object");
		}

		const entries = Object.entries(flags) as [string, Flags[keyof Flags]][];
		if (entries.length === 0) {
			throw new TypeError("flags must be a non-empty object");
		}

		const type = typeof entries[0][1];
		if (type !== "number" && type !== "bigint") {
			throw new TypeError(
				"A bitfield can only use numbers or bigints for its values",
			);
		}

		this.type = type as BitFieldPrimitiveTag<Flags>;
		this.flags = flags;
		this.#flagEntries = entries;

		if (type === "number") {
			this.zero = 0 as BitFieldZero<Flags>;

			let mask = 0;
			for (const [key, value] of entries) {
				if (typeof value !== "number")
					throw new TypeError(
						`The property "${key}" does not resolve to a number`,
					);
				if (value !== (value | 0))
					throw new RangeError(
						`The property "${key}" does not resolve to a safe bitfield value`,
					);
				if (value <= 0)
					throw new RangeError(
						`The property "${key}" resolves to a non-positive value`,
					);
				mask |= value;
			}

			this.mask = mask as ValueType<this>;
		} else {
			this.zero = 0n as BitFieldZero<Flags>;

			let mask = 0n;
			for (const [key, value] of entries) {
				if (typeof value !== "bigint")
					throw new TypeError(
						`The property "${key}" does not resolve to a bigint`,
					);
				if (value <= 0n)
					throw new RangeError(
						`The property "${key}" resolves to a non-positive value`,
					);
				mask |= value;
			}

			this.mask = mask as ValueType<this>;
		}
	}

	/**
	 * Resolves a value into a raw field of this instance's primitive type.
	 *
	 * Accepts a flag name (looked up in {@link BitField.flags}), a raw value of this instance's
	 * primitive type (masked against {@link BitField.mask}), or an array of either, combined with
	 * a union.
	 *
	 * @param resolvable The value to resolve.
	 * @returns The resolved field.
	 */
	public resolve(resolvable: ValueResolvable<this>): ValueType<this> {
		switch (typeof resolvable) {
			case "string":
				if ((resolvable as string) in this.flags)
					return this.flags[
						resolvable as keyof Flags
					] as unknown as ValueType<this>;
				throw new RangeError(
					"Received a name that could not be resolved to a property of flags",
				);
			case this.type:
				return ((resolvable as ValueType<this>) & this.mask) as ValueType<this>;
			case "object":
				if (Array.isArray(resolvable))
					return resolvable.reduce(
						(accumulator, value) => this.resolve(value) | accumulator,
						this.zero,
					);
				throw new TypeError("Received an object value that is not an Array");
			default:
				throw new TypeError(
					`Received a value that is not either type "string", type "${this.type}", or an Array`,
				);
		}
	}

	/**
	 * Checks whether `field` contains any of the bits from `bits`.
	 *
	 * @param field The field to inspect.
	 * @param bits The bits to look for.
	 * @returns Whether `field` has any of `bits`'s bits, denoted `A ∩ B ≠ ∅`.
	 */
	public any(
		field: ValueResolvable<this>,
		bits: ValueResolvable<this>,
	): boolean {
		return (this.resolve(field) & this.resolve(bits)) !== this.zero;
	}

	/**
	 * Checks whether `field` is a superset of, or equal to, `bits`.
	 *
	 * @param field The field to inspect.
	 * @param bits The bits `field` must contain.
	 * @returns Whether `field` is a superset of or equal to `bits`, denoted `A ⊇ B`.
	 */
	public has(
		field: ValueResolvable<this>,
		bits: ValueResolvable<this>,
	): boolean {
		const resolved = this.resolve(bits);
		return (this.resolve(field) & resolved) === resolved;
	}

	/**
	 * Computes the complement of `field` — every bit in {@link BitField.mask} that `field` does not
	 * have, denoted `U ∖ A`.
	 *
	 * @param field The field to complement.
	 * @returns The complement of `field`, denoted `Aᶜ` or `A'`.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * bitfield.complement(0b0100);
	 * // 0b1011
	 * ```
	 */
	public complement(field: ValueResolvable<this>): ValueType<this> {
		return this.difference(this.mask, field);
	}

	/**
	 * Combines every given field with a bitwise union.
	 *
	 * @param fields The fields to combine.
	 * @returns The result of combining every field together, denoted `∅ ⋃ fields`.
	 *
	 * @example
	 * ```typescript
	 * bitfield.union(0b0001, 0b0100);
	 * // 0b0101
	 *
	 * bitfield.union(0b1100, 0b0001, 0b0010);
	 * // 0b1111
	 * ```
	 *
	 * @see {@link https://en.wikipedia.org/wiki/Union_(set_theory)}
	 */
	public union(...fields: readonly ValueResolvable<this>[]): ValueType<this> {
		let field = this.zero as ValueType<this>;
		for (const resolvable of fields) {
			field = (field | this.resolve(resolvable)) as ValueType<this>;
		}

		return field;
	}

	/**
	 * Intersects `bitfield` with every given field.
	 *
	 * @param bitfield The starting field.
	 * @param fields The fields to intersect with `bitfield`.
	 * @returns The result of intersecting `bitfield` with every field, denoted `A ⋂ fields`.
	 *
	 * @example
	 * ```typescript
	 * bitfield.intersection(0b0001, 0b0100);
	 * // 0b0000
	 *
	 * bitfield.intersection(0b1100, 0b0100);
	 * // 0b0100
	 *
	 * bitfield.intersection(0b1101, 0b0101, 0b1100);
	 * // 0b0100
	 * ```
	 *
	 * @see {@link https://en.wikipedia.org/wiki/Intersection_(set_theory)}
	 */
	public intersection(
		bitfield: ValueResolvable<this>,
		...fields: readonly ValueResolvable<this>[]
	): ValueType<this> {
		let field = this.resolve(bitfield);
		for (const resolvable of fields) {
			field = (field & this.resolve(resolvable)) as ValueType<this>;
		}

		return field;
	}

	/**
	 * Removes from `a` every bit that exists in `b`.
	 *
	 * @param a The field to remove bits from.
	 * @param b The bits to remove from `a`.
	 * @returns The result of `a ∖ b`.
	 *
	 * @example
	 * ```typescript
	 * bitfield.difference(0b1100, 0b0100);
	 * // 0b1000
	 *
	 * bitfield.difference(0b1111, 0b0110);
	 * // 0b1001
	 * ```
	 *
	 * @see {@link https://en.wikipedia.org/wiki/Difference_(set_theory)}
	 */
	public difference(
		a: ValueResolvable<this>,
		b: ValueResolvable<this>,
	): ValueType<this> {
		return (this.resolve(a) & ~this.resolve(b)) as ValueType<this>;
	}

	/**
	 * Computes the symmetric difference of `a` and `b`, denoted `A ⊖ B` or `A Δ B` — the bits that
	 * belong to exactly one of the two fields, equivalent to `union(difference(a, b), difference(b, a))`.
	 *
	 * @remarks The empty field is neutral: `A Δ ∅ = A` and `A Δ A = ∅`.
	 *
	 * @param a The first field.
	 * @param b The second field.
	 * @returns The result of `a Δ b`.
	 *
	 * @example
	 * ```typescript
	 * bitfield.symmetricDifference(0b1100, 0b0011);
	 * // 0b1111
	 *
	 * bitfield.symmetricDifference(0b1101, 0b1011);
	 * // 0b0110
	 * ```
	 *
	 * @see {@link https://en.wikipedia.org/wiki/Symmetric_difference}
	 */
	public symmetricDifference(
		a: ValueResolvable<this>,
		b: ValueResolvable<this>,
	): ValueType<this> {
		return (this.resolve(a) ^ this.resolve(b)) as ValueType<this>;
	}

	/**
	 * Collects every flag name from {@link BitField.flags} whose bit is contained in `field`.
	 *
	 * @param field The field to read flag names from.
	 * @returns The flag names contained in `field`.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * bitfield.toArray(0b0101);
	 * // ["Read", "Edit"]
	 * ```
	 */
	public toArray(field: ValueResolvable<this>): (keyof Flags)[] {
		return [...this.toKeys(field)];
	}

	/**
	 * Iterates every flag name from {@link BitField.flags} whose bit is contained in `field`.
	 *
	 * @param field The field to read flag names from.
	 * @returns An iterator over the flag names contained in `field`.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * [...bitfield.toKeys(0b0101)];
	 * // ["Read", "Edit"]
	 * ```
	 */
	public *toKeys(field: ValueResolvable<this>): IterableIterator<keyof Flags> {
		const bits = this.resolve(field);
		for (const [key, bit] of this.#flagEntries) {
			// Inline `.has` logic for lower overhead.
			if ((bits & bit) === bit) yield key;
		}
	}

	/**
	 * Iterates every flag value from {@link BitField.flags} contained in `field`.
	 *
	 * @param field The field to read flag values from.
	 * @returns An iterator over the flag values contained in `field`.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * [...bitfield.toValues(0b0101)];
	 * // [0b0001, 0b0100]
	 * ```
	 */
	public *toValues(
		field: ValueResolvable<this>,
	): IterableIterator<ValueType<this>> {
		const bits = this.resolve(field);
		for (const [, bit] of this.#flagEntries) {
			// Inline `.has` logic for lower overhead.
			if ((bits & bit) === bit) yield bit as unknown as ValueType<this>;
		}
	}

	/**
	 * Iterates every `[name, value]` entry from {@link BitField.flags} whose value is contained in
	 * `field`.
	 *
	 * @param field The field to read flag entries from.
	 * @returns An iterator over the flag entries contained in `field`.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * [...bitfield.toEntries(0b0101)];
	 * // [["Read", 0b0001], ["Edit", 0b0100]]
	 * ```
	 */
	public *toEntries(
		field: ValueResolvable<this>,
	): IterableIterator<[key: keyof Flags, value: ValueType<this>]> {
		const bits = this.resolve(field);
		for (const [key, bit] of this.#flagEntries) {
			// Inline `.has` logic for lower overhead.
			if ((bits & bit) === bit) yield [key, bit as unknown as ValueType<this>];
		}
	}

	/**
	 * Builds an object with every flag name from {@link BitField.flags} mapped to whether its bit is
	 * contained in `field`.
	 *
	 * @param field The field to check flags against.
	 * @returns An object of flag names to booleans.
	 *
	 * @example
	 * ```typescript
	 * const bitfield = new BitField({
	 * 	Read:   0b0001,
	 * 	Write:  0b0010,
	 * 	Edit:   0b0100,
	 * 	Delete: 0b1000
	 * });
	 *
	 * bitfield.toObject(0b0101);
	 * // {
	 * // 	Read: true,
	 * // 	Write: false,
	 * // 	Edit: true,
	 * // 	Delete: false
	 * // }
	 * ```
	 */
	public toObject(field: ValueResolvable<this>): Record<keyof Flags, boolean> {
		const bits = this.resolve(field);
		return Object.fromEntries(
			this.#flagEntries.map(([key, bit]) => [key, (bits & bit) === bit]),
		) as Record<keyof Flags, boolean>;
	}
}
