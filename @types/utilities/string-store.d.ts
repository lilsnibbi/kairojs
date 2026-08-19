import type { Pointer } from "@/utilities/string-store/lib/shared/pointer.ts";

/**
 * Something a {@link Pointer} can be built from: an existing `Pointer`, passed through unchanged,
 * or anything that reports its own numeric value.
 *
 * @since 1.0.0
 */
export type PointerLike =
	| Pointer
	| { valueOf(): number }
	| { [Symbol.toPrimitive](hint: "number"): number };

/**
 * A fixed-width or variable-width binary reader/writer over a buffer, keyed by the value it
 * produces, the number of bits it occupies, and the value it accepts when serializing.
 *
 * Every entry a {@link Schema} holds is one of these — the primitives in `t` (`t.uint8`,
 * `t.string`, and so on) are the concrete implementations, and `t.array`/`t.nullable`/etc. build
 * new ones out of an existing one.
 *
 * @typeparam ValueType The type produced by {@link IType.deserialize}.
 * @typeparam BitSize The fixed number of bits this type occupies, or `null` if it is
 * variable-width.
 * @typeparam InputValue The type accepted by {@link IType.serialize}. Defaults to `ValueType`.
 *
 * @since 1.0.0
 */
export interface IType<
	ValueType,
	BitSize extends number | null,
	InputValue = ValueType,
> {
	/**
	 * Writes a value into the given buffer.
	 *
	 * @param buffer The buffer to write to.
	 * @param value The value to write.
	 */
	serialize(buffer: DuplexBuffer, value: InputValue): void;

	/**
	 * Reads a value out of the given buffer.
	 *
	 * @param buffer The buffer to read from.
	 * @param pointer Tracks the current read position within the buffer.
	 */
	deserialize(buffer: DuplexBuffer, pointer: Pointer): ValueType;

	/**
	 * The number of bits this type always occupies, or `null` if its width varies with the value
	 * being written — for example an array or a string, whose length is written alongside it.
	 */
	readonly BIT_SIZE: BitSize;
}

/**
 * A binary buffer that reads and writes fixed-width integers, floats and single bits at
 * bit-level granularity, and can round-trip itself through a UTF-16 string.
 *
 * {@link UnalignedUint16Array} is the only implementation — this interface exists so
 * {@link IType}s never depend on its concrete storage layout.
 *
 * @since 1.0.0
 */
export interface DuplexBuffer {
	/**
	 * Reads the raw 16-bit word at the given index, or `undefined` if it is out of range.
	 *
	 * @param index The word index to read.
	 */
	at(index: number): number | undefined;

	/**
	 * The buffer's total capacity, in 16-bit words.
	 */
	get maxLength(): number;

	/**
	 * The buffer's total capacity, in bits.
	 */
	get maxBitLength(): number;

	/**
	 * The number of 16-bit words written so far.
	 */
	get length(): number;

	/**
	 * The number of bits written so far.
	 */
	get bitLength(): number;

	/**
	 * Appends a single bit, taking only the lowest bit of `value`.
	 */
	writeBit(value: number): void;

	/**
	 * Appends a 2-bit signed integer.
	 */
	writeInt2(value: number): void;

	/**
	 * Appends a 4-bit signed integer.
	 */
	writeInt4(value: number): void;

	/**
	 * Appends an 8-bit signed integer.
	 */
	writeInt8(value: number): void;

	/**
	 * Appends a 16-bit signed integer.
	 */
	writeInt16(value: number): void;

	/**
	 * Appends a 32-bit signed integer.
	 */
	writeInt32(value: number): void;

	/**
	 * Appends a 64-bit signed integer, given as a `number`.
	 */
	writeInt64(value: number): void;

	/**
	 * Appends a 32-bit signed integer, given as a `bigint`.
	 */
	writeBigInt32(value: bigint): void;

	/**
	 * Appends a 64-bit signed integer, given as a `bigint`.
	 */
	writeBigInt64(value: bigint): void;

	/**
	 * Appends a 32-bit floating point number.
	 */
	writeFloat32(value: number): void;

	/**
	 * Appends a 64-bit floating point number.
	 */
	writeFloat64(value: number): void;

	/**
	 * Reads a single bit at the given offset.
	 */
	readBit(offset: PointerLike): 0 | 1;

	/**
	 * Reads a 2-bit signed integer at the given offset.
	 */
	readInt2(offset: PointerLike): number;

	/**
	 * Reads a 2-bit unsigned integer at the given offset.
	 */
	readUint2(offset: PointerLike): number;

	/**
	 * Reads a 4-bit signed integer at the given offset.
	 */
	readInt4(offset: PointerLike): number;

	/**
	 * Reads a 4-bit unsigned integer at the given offset.
	 */
	readUint4(offset: PointerLike): number;

	/**
	 * Reads an 8-bit signed integer at the given offset.
	 */
	readInt8(offset: PointerLike): number;

	/**
	 * Reads an 8-bit unsigned integer at the given offset.
	 */
	readUint8(offset: PointerLike): number;

	/**
	 * Reads a 16-bit signed integer at the given offset.
	 */
	readInt16(offset: PointerLike): number;

	/**
	 * Reads a 16-bit unsigned integer at the given offset.
	 */
	readUint16(offset: PointerLike): number;

	/**
	 * Reads a 32-bit signed integer at the given offset.
	 */
	readInt32(offset: PointerLike): number;

	/**
	 * Reads a 32-bit unsigned integer at the given offset.
	 */
	readUint32(offset: PointerLike): number;

	/**
	 * Reads a 64-bit signed integer at the given offset, returned as a `number`.
	 */
	readInt64(offset: PointerLike): number;

	/**
	 * Reads a 64-bit unsigned integer at the given offset, returned as a `number`.
	 */
	readUint64(offset: PointerLike): number;

	/**
	 * Reads a 32-bit signed integer at the given offset, returned as a `bigint`.
	 */
	readBigInt32(offset: PointerLike): bigint;

	/**
	 * Reads a 32-bit unsigned integer at the given offset, returned as a `bigint`.
	 */
	readBigUint32(offset: PointerLike): bigint;

	/**
	 * Reads a 64-bit signed integer at the given offset, returned as a `bigint`.
	 */
	readBigInt64(offset: PointerLike): bigint;

	/**
	 * Reads a 64-bit unsigned integer at the given offset, returned as a `bigint`.
	 */
	readBigUint64(offset: PointerLike): bigint;

	/**
	 * Reads a 32-bit floating point number at the given offset.
	 */
	readFloat32(offset: PointerLike): number;

	/**
	 * Reads a 64-bit floating point number at the given offset.
	 */
	readFloat64(offset: PointerLike): number;

	/**
	 * Renders the written words as a UTF-16 string, suitable for storage anywhere a plain string
	 * fits.
	 */
	toString(): string;

	/**
	 * Returns the written words as a plain `Uint16Array`, trimmed to {@link DuplexBuffer.length}.
	 */
	toArray(): Uint16Array;
}

/**
 * Adds one named entry to a {@link Schema}'s tracked entries, rejecting the merge at the type
 * level if the name already exists.
 *
 * @internal Backs the return type of every `Schema` builder method (`.uint8()`, `.string()`, …);
 * not meant to be referenced directly.
 *
 * @since 1.0.0
 */
export type SchemaMerge<
	Id extends number,
	Entries extends object,
	EntryName extends string,
	EntryType extends IType<any, number | null>,
> = EntryName extends keyof Entries
	? never
	: import("@/utilities/string-store/lib/schema/schema.ts").Schema<
			Id,
			{
				[K in EntryName | keyof Entries]: K extends keyof Entries
					? Entries[K]
					: EntryType;
			}
		>;

/**
 * The property names a {@link Schema} accepts through `.get()`.
 *
 * @since 1.0.0
 */
export type KeyOfSchema<SchemaValue extends object> =
	SchemaValue extends import("@/utilities/string-store/lib/schema/schema.ts").Schema<
		infer _ extends number,
		infer Type extends object
	>
		? keyof Type & string
		: never;

/**
 * The union of every {@link IType} a {@link Schema} holds.
 *
 * @since 1.0.0
 */
export type ValueOfSchema<SchemaValue extends object> =
	SchemaValue extends import("@/utilities/string-store/lib/schema/schema.ts").Schema<
		infer _ extends number,
		infer Type extends object
	>
		? { [K in keyof Type]: Type[K] }[keyof Type]
		: never;

/**
 * The union of `[name, type]` pairs a {@link Schema} iterates over.
 *
 * @since 1.0.0
 */
export type EntryOfSchema<SchemaValue extends object> =
	SchemaValue extends import("@/utilities/string-store/lib/schema/schema.ts").Schema<
		infer _ extends number,
		infer Type extends object
	>
		? { [K in keyof Type]: readonly [K, Type[K]] }[keyof Type]
		: never;

/**
 * The value a single {@link IType} deserializes to.
 *
 * @since 1.0.0
 */
export type UnwrapSchemaType<Type extends object> =
	Type extends IType<infer ValueType, infer _BitSize, infer _InputType>
		? ValueType
		: never;

/**
 * The deserialized shape of every entry in a {@link Schema}, keyed by property name.
 *
 * @since 1.0.0
 */
export type UnwrapSchemaEntries<Entries extends object> = {
	[K in keyof Entries]: UnwrapSchemaType<Entries[K] & object>;
} & object;

/**
 * The value `Schema#deserialize` returns for the given schema.
 *
 * @since 1.0.0
 */
export type UnwrapSchema<SchemaValue extends object> =
	SchemaValue extends import("@/utilities/string-store/lib/schema/schema.ts").Schema<
		infer _Id extends number,
		infer Type extends object
	>
		? UnwrapSchemaEntries<Type>
		: never;

/**
 * Drops every property whose value type is `never` — used to remove constant entries (which
 * cannot be serialized) from the shape `Schema#serialize` accepts.
 *
 * @internal
 *
 * @since 1.0.0
 */
type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

/**
 * The value a single {@link IType} accepts when serializing.
 *
 * @since 1.0.0
 */
export type SerializeValueType<Type extends object> =
	Type extends IType<infer _ValueType, infer _BitSize, infer InputType>
		? InputType
		: never;

/**
 * The shape `Schema#serialize` accepts for the given entries, with constant entries omitted.
 *
 * @since 1.0.0
 */
export type SerializeValueEntries<Entries extends object> = OmitNever<{
	[K in keyof Entries]: SerializeValueType<Entries[K] & object>;
}>;

/**
 * The value `Schema#serialize` accepts for the given schema.
 *
 * @since 1.0.0
 */
export type SerializeValue<SchemaValue extends object> =
	SchemaValue extends import("@/utilities/string-store/lib/schema/schema.ts").Schema<
		infer _Id extends number,
		infer Type extends object
	>
		? SerializeValueEntries<Type>
		: never;

/**
 * Adds one schema, keyed by its id, to a {@link SchemaStore}'s tracked entries, rejecting the
 * merge at the type level if the id already exists.
 *
 * @internal Backs the return type of `SchemaStore#add`; not meant to be referenced directly.
 *
 * @since 1.0.0
 */
export type SchemaStoreMerge<
	Entries extends object,
	Id extends number,
	Type extends object,
> = Id extends keyof Entries
	? never
	: import("@/utilities/string-store/lib/schema/schema-store.ts").SchemaStore<{
			[K in Id | keyof Entries]: K extends keyof Entries ? Entries[K] : Type;
		}>;

/**
 * The schema ids a {@link SchemaStore} accepts through `.get()`, `.serialize()` and friends.
 *
 * @since 1.0.0
 */
export type KeyOfStore<SchemaStoreValue extends object> =
	SchemaStoreValue extends import("@/utilities/string-store/lib/schema/schema-store.ts").SchemaStore<
		infer Schemas extends object
	>
		? keyof Schemas & number
		: never;

/**
 * The union of every {@link Schema} a {@link SchemaStore} holds.
 *
 * @since 1.0.0
 */
export type ValueOfStore<SchemaStoreValue extends object> =
	SchemaStoreValue extends import("@/utilities/string-store/lib/schema/schema-store.ts").SchemaStore<
		infer Schemas extends object
	>
		? Schemas[keyof Schemas & number]
		: never;

/**
 * The union of `[id, schema]` pairs a {@link SchemaStore} iterates over.
 *
 * @since 1.0.0
 */
export type EntryOfStore<SchemaStoreValue extends object> =
	SchemaStoreValue extends import("@/utilities/string-store/lib/schema/schema-store.ts").SchemaStore<
		infer Schemas extends object
	>
		? { [K in keyof Schemas]: readonly [K & number, Schemas[K]] }[keyof Schemas]
		: never;

/**
 * The value `SchemaStore#deserialize` returns: the id of the schema that was used, paired with
 * its deserialized data.
 *
 * @since 1.0.0
 */
export type DeserializationResult<SchemaStoreEntries extends object> = {
	[K in keyof SchemaStoreEntries]: {
		id: K;
		data: UnwrapSchema<SchemaStoreEntries[K] & object>;
	};
}[keyof SchemaStoreEntries];
