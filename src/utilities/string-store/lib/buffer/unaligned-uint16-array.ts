import type { DuplexBuffer, PointerLike } from "@types";
import { codepointRanges } from "../shared/codepoints.ts";
import { Pointer } from "../shared/pointer.ts";

const converterUint8 = new Uint8Array(8);
const converterUint16 = new Uint16Array(converterUint8.buffer);
const converterUint32 = new Uint32Array(converterUint8.buffer);
const converterUint64 = new BigUint64Array(converterUint8.buffer);

const converterInt32 = new Int32Array(converterUint8.buffer);
const converterInt64 = new BigInt64Array(converterUint8.buffer);

const converterFloat = new Float32Array(converterUint8.buffer);
const converterDouble = new Float64Array(converterUint8.buffer);

/**
 * A {@link DuplexBuffer} backed by a `Uint16Array`, packing values in at bit-level granularity so
 * a schema's total size is never rounded up to the next byte or word.
 *
 * Every stored word doubles as a UTF-16 code unit, so once writing is done the buffer can be
 * rendered straight to a string with {@link UnalignedUint16Array.toString} — that string is the
 * package's actual "string store" output. Values outside the safe UTF-16 range are remapped
 * through {@link codepointRanges} so the resulting string never contains a surrogate or a
 * disallowed code point.
 *
 * @since 1.0.0
 */
export class UnalignedUint16Array implements DuplexBuffer {
	#buffer: Uint16Array;
	#bitLength = 0;
	#wordIndex = 0;
	#wordLength = 0;

	/**
	 * @param maxLength The buffer's capacity, in 16-bit words.
	 */
	public constructor(maxLength: number) {
		this.#buffer = new Uint16Array(maxLength);
	}

	public at(index: number): number | undefined {
		return this.#buffer.at(index);
	}

	public get maxLength(): number {
		return this.#buffer.length;
	}

	public get maxBitLength(): number {
		return this.#buffer.length * 16;
	}

	public get length(): number {
		return this.#wordLength;
	}

	public get bitLength(): number {
		return this.#bitLength;
	}

	public writeBit(value: number): void {
		this.#writeBit(value);
	}

	public writeInt2(value: number): void {
		this.writeBit(value & 1);
		this.writeBit(value >> 1);
	}

	public writeInt4(value: number): void {
		this.writeInt2(value & 0b11);
		this.writeInt2(value >> 2);
	}

	public writeInt8(value: number): void {
		this.writeInt4(value & 0b1111);
		this.writeInt4(value >> 4);
	}

	public writeInt16(value: number): void {
		this.#bufferWrite16(value);
	}

	public writeInt32(value: number): void {
		this.#bufferWrite16(value);
		this.#bufferWrite16(value >> 16);
	}

	public writeInt64(value: number): void {
		this.writeBigInt64(BigInt(value));
	}

	public writeBigInt32(value: bigint): void {
		converterInt64[0] = value;
		this.#bufferWrite16(converterUint16[0]);
		this.#bufferWrite16(converterUint16[1]);
	}

	public writeBigInt64(value: bigint): void {
		converterInt64[0] = value;
		this.#bufferWrite16(converterUint16[0]);
		this.#bufferWrite16(converterUint16[1]);
		this.#bufferWrite16(converterUint16[2]);
		this.#bufferWrite16(converterUint16[3]);
	}

	public writeFloat32(value: number): void {
		converterFloat[0] = value;
		this.#bufferWrite16(converterUint16[0]);
		this.#bufferWrite16(converterUint16[1]);
	}

	public writeFloat64(value: number): void {
		converterDouble[0] = value;
		this.#bufferWrite16(converterUint16[0]);
		this.#bufferWrite16(converterUint16[1]);
		this.#bufferWrite16(converterUint16[2]);
		this.#bufferWrite16(converterUint16[3]);
	}

	public readBit(offset: PointerLike): 0 | 1 {
		const pointer = Pointer.from(offset);
		return this.#readBit(pointer) as 0 | 1;
	}

	public readInt2(offset: PointerLike): number {
		// Sign-extends a 2-bit integer to a 32-bit one:
		// 0b01 -> 0b0100_0000_0000_0000 -> 0b000_0000_0000_0001 (1)
		// 0b10 -> 0b1000_0000_0000_0000 -> 0b111_1111_1111_1110 (-2)
		return (this.readUint2(offset) << 30) >> 30;
	}

	public readUint2(offset: PointerLike): number {
		const pointer = Pointer.from(offset);
		return this.#readBit(pointer) | (this.#readBit(pointer) << 1);
	}

	public readInt4(offset: PointerLike): number {
		// Sign-extends a 4-bit integer to a 32-bit one, as shown in `readInt2`.
		return (this.readUint4(offset) << 28) >> 28;
	}

	public readUint4(offset: PointerLike): number {
		const pointer = Pointer.from(offset);
		return (
			this.#readBit(pointer) |
			(this.#readBit(pointer) << 1) |
			(this.#readBit(pointer) << 2) |
			(this.#readBit(pointer) << 3)
		);
	}

	public readInt8(offset: PointerLike): number {
		// Sign-extends an 8-bit integer to a 32-bit one, as shown in `readInt2`.
		return (this.readUint8(offset) << 24) >> 24;
	}

	public readUint8(offset: PointerLike): number {
		const pointer = Pointer.from(offset);
		return this.#readByte(pointer);
	}

	public readInt16(offset: PointerLike): number {
		// Sign-extends a 16-bit integer to a 32-bit one, as shown in `readInt2`.
		return (this.readUint16(offset) << 16) >> 16;
	}

	public readUint16(offset: PointerLike): number {
		this.#bufferRead16(Pointer.from(offset));
		return converterUint16[0];
	}

	public readInt32(offset: PointerLike): number {
		this.#bufferRead32(Pointer.from(offset));
		return converterInt32[0];
	}

	public readUint32(offset: PointerLike): number {
		this.#bufferRead32(Pointer.from(offset));
		return converterUint32[0];
	}

	public readInt64(offset: PointerLike): number {
		return Number(this.readBigInt64(offset));
	}

	public readUint64(offset: PointerLike): number {
		return Number(this.readBigUint64(offset));
	}

	public readBigInt32(offset: PointerLike): bigint {
		this.#bufferRead32(Pointer.from(offset));
		return BigInt(converterInt32[0]);
	}

	public readBigUint32(offset: PointerLike): bigint {
		this.#bufferRead32(Pointer.from(offset));
		return BigInt(converterUint32[0]);
	}

	public readBigInt64(offset: PointerLike): bigint {
		this.#bufferRead64(Pointer.from(offset));
		return converterInt64[0];
	}

	public readBigUint64(offset: PointerLike): bigint {
		this.#bufferRead64(Pointer.from(offset));
		return converterUint64[0];
	}

	public readFloat32(offset: PointerLike): number {
		this.#bufferRead32(Pointer.from(offset));
		return converterFloat[0];
	}

	public readFloat64(offset: PointerLike): number {
		this.#bufferRead64(Pointer.from(offset));
		return converterDouble[0];
	}

	public toString(): string {
		let result = "";

		for (let index = 0; index < this.length; index++) {
			result += String.fromCodePoint(
				this.#uint16ToCodepoint(this.#buffer[index]),
			);
		}

		return result;
	}

	public toArray(): Uint16Array {
		return this.#buffer.slice(0, this.length);
	}

	/**
	 * Maps a stored word back to the original Unicode code point it represents, via
	 * {@link codepointRanges}.
	 *
	 * @throws {RangeError} If the word does not fall inside any known range.
	 */
	#uint16ToCodepoint(index: number): number {
		for (const range of codepointRanges) {
			if (index >= range.indexStart && index <= range.indexEnd) {
				return range.start + (index - range.indexStart);
			}
		}

		throw new RangeError(`Index ${index} is out of range`);
	}

	/**
	 * Reads a single bit at the given pointer and advances it by one.
	 */
	#readBit(pointer: Pointer): number {
		const bitOffset = pointer.value;
		const index = bitOffset >> 4;
		const bitIndex = bitOffset & 0xf;
		pointer.add(1);
		return (this.#buffer[index] >> bitIndex) & 1;
	}

	/**
	 * Reads eight bits at the given pointer, one at a time, and advances it by eight.
	 */
	#readByte(pointer: Pointer): number {
		return (
			this.#readBit(pointer) |
			(this.#readBit(pointer) << 1) |
			(this.#readBit(pointer) << 2) |
			(this.#readBit(pointer) << 3) |
			(this.#readBit(pointer) << 4) |
			(this.#readBit(pointer) << 5) |
			(this.#readBit(pointer) << 6) |
			(this.#readBit(pointer) << 7)
		);
	}

	/**
	 * Reads 16 bits at the given pointer into the shared byte converter, ready to be reinterpreted
	 * through {@link converterUint16} and friends.
	 */
	#bufferRead16(pointer: Pointer): void {
		converterUint8[0] = this.#readByte(pointer);
		converterUint8[1] = this.#readByte(pointer);
	}

	/**
	 * Reads 32 bits at the given pointer into the shared byte converter.
	 */
	#bufferRead32(pointer: Pointer): void {
		converterUint8[0] = this.#readByte(pointer);
		converterUint8[1] = this.#readByte(pointer);
		converterUint8[2] = this.#readByte(pointer);
		converterUint8[3] = this.#readByte(pointer);
	}

	/**
	 * Reads 64 bits at the given pointer into the shared byte converter.
	 */
	#bufferRead64(pointer: Pointer): void {
		converterUint8[0] = this.#readByte(pointer);
		converterUint8[1] = this.#readByte(pointer);
		converterUint8[2] = this.#readByte(pointer);
		converterUint8[3] = this.#readByte(pointer);
		converterUint8[4] = this.#readByte(pointer);
		converterUint8[5] = this.#readByte(pointer);
		converterUint8[6] = this.#readByte(pointer);
		converterUint8[7] = this.#readByte(pointer);
	}

	/**
	 * Appends a single bit at the current write position.
	 *
	 * @throws {RangeError} If the buffer has no room left.
	 */
	#writeBit(value: number): void {
		if (this.#wordIndex === this.maxLength) {
			throw new RangeError("The buffer is full");
		}

		if (value) {
			const index = this.#wordIndex;
			const bitIndex = this.bitLength & 0xf;
			this.#buffer[index] |= 1 << bitIndex;
		}

		if ((this.#bitLength & 0xf) === 0) this.#wordLength++;
		this.#bitLength++;
		if ((this.#bitLength & 0xf) === 0) this.#wordIndex++;
	}

	/**
	 * Appends 16 bits at the current write position, splitting the value across two words when the
	 * write position is not word-aligned.
	 *
	 * @throws {RangeError} If the buffer has no room left.
	 */
	#bufferWrite16(value: number): void {
		const wordIndex = this.#wordIndex;
		const bitIndex = this.bitLength & 0xf;

		// When `bitIndex` is `0`, the value fits entirely in the current word, so only the current
		// word needs to be validated. Otherwise the value is split across the current word and the
		// next one, so the next word must be validated instead.
		if (wordIndex + (bitIndex === 0 ? 0 : 1) === this.maxLength) {
			throw new RangeError("The buffer is full");
		}

		if (bitIndex === 0) {
			this.#buffer[wordIndex] = value;
		} else {
			value &= 0xffff;
			this.#buffer[wordIndex] |= value << bitIndex;
			this.#buffer[wordIndex + 1] = value >> (16 - bitIndex);
		}

		this.#bitLength += 16;
		this.#wordIndex++;
		this.#wordLength++;
	}

	/**
	 * Coerces a string or an existing {@link DuplexBuffer} into a {@link DuplexBuffer}, rebuilding a
	 * fresh {@link UnalignedUint16Array} out of a string's code points.
	 *
	 * @param value The string or buffer to coerce.
	 */
	public static from(value: string | DuplexBuffer): DuplexBuffer {
		if (typeof value !== "string") return value;

		const codepoints = Array.from(
			value,
			(character) => character.codePointAt(0)!,
		);
		const buffer = new UnalignedUint16Array(value.length);

		for (let index = 0; index < codepoints.length; index++) {
			const wordIndex = UnalignedUint16Array.#codepointToUint16(
				codepoints[index],
			);
			buffer.#buffer[index] = wordIndex;
		}

		buffer.#bitLength = value.length << 4;
		return buffer;
	}

	/**
	 * Maps a Unicode code point to the compact word index that represents it, via
	 * {@link codepointRanges}.
	 *
	 * @throws {RangeError} If the code point does not fall inside any known range.
	 */
	static #codepointToUint16(codepoint: number): number {
		for (const range of codepointRanges) {
			if (codepoint >= range.start && codepoint <= range.end) {
				return range.indexStart + (codepoint - range.start);
			}
		}

		throw new RangeError(`Codepoint ${codepoint} is out of range`);
	}
}
