import type { PointerLike } from "@types";
import { isValidLength } from "./common.ts";

/**
 * Tracks a mutable read position inside a buffer, so a single position can be threaded through
 * and advanced by several reader calls in sequence.
 *
 * @privateRemarks
 *
 * This mirrors constructs from lower-level languages: `int*` in C/C++, `ref int` in C#, and
 * `*mut i32` in Rust.
 *
 * @since 1.0.0
 */
export class Pointer {
	#value = 0;

	/**
	 * The current position.
	 */
	public get value(): number {
		return this.#value;
	}

	/**
	 * Advances the position by the given amount.
	 *
	 * @param value The number of bits to advance by.
	 * @throws {RangeError} If the resulting position is not a valid length.
	 */
	public add(value: number): this {
		const added = this.#value + value;
		if (!isValidLength(added)) {
			throw new RangeError(
				"The pointer value cannot be an invalid length value",
			);
		}

		this.#value = added;
		return this;
	}

	/**
	 * Coerces a {@link PointerLike} into a {@link Pointer}, passing an existing instance through
	 * unchanged.
	 *
	 * @param pointer The value to coerce.
	 */
	public static from(pointer: PointerLike): Pointer {
		if (pointer instanceof Pointer) {
			return pointer;
		}

		const instance = new Pointer();
		instance.add(Number(pointer));
		return instance;
	}
}
