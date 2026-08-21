import type {
	DuplexBuffer,
	EntryOfSchema,
	IType,
	KeyOfSchema,
	PointerLike,
	SchemaMerge,
	SerializeValueEntries,
	UnwrapSchemaEntries,
	ValueOfSchema,
} from "@types";
import { UnalignedUint16Array } from "../buffer/unalignedUint16Array.ts";
import { Pointer } from "../shared/pointer.ts";
import { t } from "../types/index.ts";

/**
 * Builds up a binary layout, one named property at a time, and serializes or deserializes values
 * matching that layout to and from a compact string.
 *
 * Each builder method (`.uint8()`, `.string()`, `.nullable()`, and so on) returns `this`, widened
 * at the type level to also know about the newly added property — chaining them produces a schema
 * whose `serialize`/`deserialize` signatures are inferred from the exact sequence of calls made.
 *
 * @typeparam Id The schema's numeric identifier, written ahead of its data so a
 * {@link SchemaStore} can tell which schema a serialized value belongs to.
 * @typeparam Entries The accumulated shape of the schema's properties, built up by chaining
 * builder methods.
 *
 * @since 1.0.0
 */
export class Schema<
	Id extends number = number,
	Entries extends object = object,
> {
	readonly #id: Id;
	readonly #types = new Map<string, IType<any, number | null>>();
	#bitSize: number | null = 0;

	/**
	 * @param id The schema's numeric identifier.
	 */
	public constructor(id: Id) {
		this.#id = id;
	}

	/**
	 * The schema's identifier.
	 */
	public get id(): Id {
		return this.#id;
	}

	/**
	 * The total bit size of the schema's entries, or `null` if any entry has a variable size.
	 */
	public get bitSize(): number | null {
		return this.#bitSize;
	}

	/**
	 * The total bit size of the schema's entries plus its identifier, or `null` if any entry has a
	 * variable size.
	 */
	public get totalBitSize(): number | null {
		return this.#bitSize === null ? null : this.#bitSize + 16;
	}

	/**
	 * Retrieves the {@link IType} registered under the given property name.
	 *
	 * @param name The property name to look up.
	 * @throws {Error} If no property with that name exists.
	 */
	public get<const Name extends keyof Entries & string>(
		name: Name,
	): Entries[Name] {
		const type = this.#types.get(name) as Entries[Name];
		if (!type)
			throw new Error(
				`Schema with id ${this.#id} does not have a property with name "${name}"`,
			);
		return type;
	}

	/**
	 * Serializes the given value into a freshly created buffer, then renders it to a string.
	 *
	 * @see {@link Schema.serializeRaw}, which this method delegates to before calling `toString()`
	 * on the result.
	 *
	 * @param value The value to serialize.
	 * @param defaultMaximumArrayLength The buffer capacity to fall back to when
	 * {@link Schema.totalBitSize} is variable. Defaults to `100`.
	 */
	public serialize(
		value: Readonly<SerializeValueEntries<Entries>>,
		defaultMaximumArrayLength = 100,
	): string {
		return this.serializeRaw(value, defaultMaximumArrayLength).toString();
	}

	/**
	 * Serializes the given value into a freshly created buffer.
	 *
	 * @param value The value to serialize.
	 * @param defaultMaximumArrayLength The buffer capacity to fall back to when
	 * {@link Schema.totalBitSize} is variable. Defaults to `100`.
	 */
	public serializeRaw(
		value: Readonly<SerializeValueEntries<Entries>>,
		defaultMaximumArrayLength = 100,
	): DuplexBuffer {
		const buffer = new UnalignedUint16Array(
			this.totalBitSize ?? defaultMaximumArrayLength,
		);
		this.serializeInto(buffer, value);
		return buffer;
	}

	/**
	 * Serializes the given value into an existing buffer, writing the schema's identifier first and
	 * then each property in turn.
	 *
	 * @param buffer The buffer to write into.
	 * @param value The value to serialize.
	 */
	public serializeInto(
		buffer: DuplexBuffer,
		value: Readonly<SerializeValueEntries<Entries>>,
	): void {
		buffer.writeInt16(this.#id);
		for (const [name, type] of this) {
			(type as IType<any, number | null>).serialize(
				buffer,
				(value as any)[name],
			);
		}
	}

	/**
	 * Deserializes a value out of the given buffer.
	 *
	 * @note Unlike {@link Schema.serializeInto}, this does not read the schema's identifier from the
	 * buffer — reading it is {@link SchemaStore}'s responsibility.
	 *
	 * @param buffer The buffer, or its string rendering, to deserialize from.
	 * @param pointer The position to start reading from.
	 */
	public deserialize(
		buffer: DuplexBuffer | string,
		pointer: PointerLike,
	): UnwrapSchemaEntries<Entries> {
		buffer = UnalignedUint16Array.from(buffer);
		pointer = Pointer.from(pointer);
		const result = Object.create(null) as UnwrapSchemaEntries<Entries>;
		for (const [name, type] of this) {
			// @ts-expect-error Complex types
			result[name] = type.deserialize(buffer, pointer);
		}
		return result;
	}

	/**
	 * Adds a variable-length array property.
	 *
	 * @see {@link Schema.fixedLengthArray} for a fixed-length variant.
	 *
	 * @param name The property name.
	 * @param type The element type.
	 */
	public array<
		const Name extends string,
		const ValueType,
		const ValueBitSize extends number | null,
	>(name: Name, type: IType<ValueType, ValueBitSize>) {
		return this.#addType(name, t.array(type));
	}

	/**
	 * Adds a fixed-length array property.
	 *
	 * @see {@link Schema.array} for a variable-length variant.
	 *
	 * @param name The property name.
	 * @param type The element type.
	 * @param length The array's fixed length.
	 */
	public fixedLengthArray<
		const Name extends string,
		const ValueType,
		const ValueBitSize extends number | null,
	>(name: Name, type: IType<ValueType, ValueBitSize>, length: number) {
		return this.#addType(name, t.fixedLengthArray(type, length));
	}

	/**
	 * Adds a UTF-8 string property.
	 *
	 * @param name The property name.
	 */
	public string<const Name extends string>(name: Name) {
		return this.#addType(name, t.string);
	}

	/**
	 * Adds a boolean property.
	 *
	 * @param name The property name.
	 */
	public boolean<const Name extends string>(name: Name) {
		return this.#addType(name, t.boolean);
	}

	/**
	 * Adds a single-bit property.
	 *
	 * @param name The property name.
	 */
	public bit<const Name extends string>(name: Name) {
		return this.#addType(name, t.bit);
	}

	/**
	 * Adds a 2-bit signed integer property, ranging from -2 to 1 inclusive.
	 *
	 * @param name The property name.
	 */
	public int2<const Name extends string>(name: Name) {
		return this.#addType(name, t.int2);
	}

	/**
	 * Adds a 2-bit unsigned integer property, ranging from 0 to 3 inclusive.
	 *
	 * @param name The property name.
	 */
	public uint2<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint2);
	}

	/**
	 * Adds a 4-bit signed integer property, ranging from -8 to 7 inclusive.
	 *
	 * @param name The property name.
	 */
	public int4<const Name extends string>(name: Name) {
		return this.#addType(name, t.int4);
	}

	/**
	 * Adds a 4-bit unsigned integer property, ranging from 0 to 15 inclusive.
	 *
	 * @param name The property name.
	 */
	public uint4<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint4);
	}

	/**
	 * Adds an 8-bit signed integer property, ranging from -128 to 127 inclusive.
	 *
	 * @param name The property name.
	 */
	public int8<const Name extends string>(name: Name) {
		return this.#addType(name, t.int8);
	}

	/**
	 * Adds an 8-bit unsigned integer property, ranging from 0 to 255 inclusive.
	 *
	 * @param name The property name.
	 */
	public uint8<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint8);
	}

	/**
	 * Adds a 16-bit signed integer property, ranging from -32768 to 32767 inclusive.
	 *
	 * @param name The property name.
	 */
	public int16<const Name extends string>(name: Name) {
		return this.#addType(name, t.int16);
	}

	/**
	 * Adds a 16-bit unsigned integer property, ranging from 0 to 65535 inclusive.
	 *
	 * @param name The property name.
	 */
	public uint16<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint16);
	}

	/**
	 * Adds a 32-bit signed integer property, ranging from -2,147,483,648 to 2,147,483,647 inclusive.
	 *
	 * @param name The property name.
	 */
	public int32<const Name extends string>(name: Name) {
		return this.#addType(name, t.int32);
	}

	/**
	 * Adds a 32-bit unsigned integer property, ranging from 0 to 4,294,967,295 inclusive.
	 *
	 * @param name The property name.
	 */
	public uint32<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint32);
	}

	/**
	 * Adds a 64-bit signed integer property, given and returned as a `number`.
	 *
	 * @remarks
	 * The nominal range is -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807, but values
	 * outside `Number.MIN_SAFE_INTEGER`..`Number.MAX_SAFE_INTEGER` may lose precision.
	 *
	 * @param name The property name.
	 */
	public int64<const Name extends string>(name: Name) {
		return this.#addType(name, t.int64);
	}

	/**
	 * Adds a 64-bit unsigned integer property, given and returned as a `number`.
	 *
	 * @remarks
	 * The nominal range is 0 to 18,446,744,073,709,551,615, but values past
	 * `Number.MAX_SAFE_INTEGER` may lose precision.
	 *
	 * @param name The property name.
	 */
	public uint64<const Name extends string>(name: Name) {
		return this.#addType(name, t.uint64);
	}

	/**
	 * Adds a 32-bit signed integer property, given and returned as a `bigint`, ranging from
	 * -2,147,483,648n to 2,147,483,647n inclusive.
	 *
	 * @param name The property name.
	 */
	public bigInt32<const Name extends string>(name: Name) {
		return this.#addType(name, t.bigInt32);
	}

	/**
	 * Adds a 32-bit unsigned integer property, given and returned as a `bigint`, ranging from 0n to
	 * 4,294,967,295n inclusive.
	 *
	 * @param name The property name.
	 */
	public bigUint32<const Name extends string>(name: Name) {
		return this.#addType(name, t.bigUint32);
	}

	/**
	 * Adds a 64-bit signed integer property, given and returned as a `bigint`, ranging from
	 * -9,223,372,036,854,775,808n to 9,223,372,036,854,775,807n inclusive.
	 *
	 * @param name The property name.
	 */
	public bigInt64<const Name extends string>(name: Name) {
		return this.#addType(name, t.bigInt64);
	}

	/**
	 * Adds a 64-bit unsigned integer property, given and returned as a `bigint`, ranging from 0n to
	 * 18,446,744,073,709,551,615n inclusive.
	 *
	 * @param name The property name.
	 */
	public bigUint64<const Name extends string>(name: Name) {
		return this.#addType(name, t.bigUint64);
	}

	/**
	 * Adds a 32-bit floating point property, ranging from -3.4028234663852886e+38 to
	 * 3.4028234663852886e+38 inclusive.
	 *
	 * @param name The property name.
	 */
	public float32<const Name extends string>(name: Name) {
		return this.#addType(name, t.float32);
	}

	/**
	 * Adds a 64-bit floating point property, ranging from -1.7976931348623157e+308 to
	 * 1.7976931348623157e+308 inclusive.
	 *
	 * @param name The property name.
	 */
	public float64<const Name extends string>(name: Name) {
		return this.#addType(name, t.float64);
	}

	/**
	 * Adds a property whose underlying type is stored behind a presence bit, so `null` and
	 * `undefined` round-trip as `null`.
	 *
	 * @param name The property name.
	 * @param type The underlying type, used only when a value is present.
	 */
	public nullable<
		const Name extends string,
		const ValueType,
		const ValueBitSize extends number | null,
	>(name: Name, type: IType<ValueType, ValueBitSize>) {
		return this.#addType(name, t.nullable(type));
	}

	/**
	 * Adds a Discord snowflake property, equivalent to {@link Schema.bigUint64} but accepting a
	 * numeric string as well as a `bigint` when serializing.
	 *
	 * @param name The property name.
	 */
	public snowflake<const Name extends string>(name: Name) {
		return this.#addType(name, t.snowflake);
	}

	/**
	 * Adds a constant property: a fixed value attached to the schema's deserialized shape without
	 * ever being written to the buffer.
	 *
	 * @param name The property name.
	 * @param constantValue The value every deserialization returns.
	 */
	public constant<const Name extends string, const ValueType>(
		name: Name,
		constantValue: ValueType,
	) {
		return this.#addType(name, t.constant(constantValue));
	}

	/**
	 * Iterates the schema's property names.
	 */
	public keys(): IterableIterator<KeyOfSchema<this>> {
		return this.#types.keys() as IterableIterator<KeyOfSchema<this>>;
	}

	/**
	 * Iterates the schema's property types.
	 */
	public values(): IterableIterator<ValueOfSchema<this>> {
		return this.#types.values() as IterableIterator<ValueOfSchema<this>>;
	}

	/**
	 * Iterates the schema's `[name, type]` entries.
	 */
	public entries(): IterableIterator<EntryOfSchema<this>> {
		return this.#types.entries() as IterableIterator<EntryOfSchema<this>>;
	}

	public [Symbol.iterator](): IterableIterator<EntryOfSchema<this>> {
		return this.entries();
	}

	/**
	 * Registers a new property, updating the tracked bit size and returning `this` widened to
	 * include it.
	 *
	 * @throws {Error} If a property with the same name is already registered.
	 */
	#addType<
		const EntryName extends string,
		const ValueType,
		const ValueBitSize extends number | null,
		InputValue,
	>(
		name: EntryName,
		type: IType<ValueType, ValueBitSize, InputValue>,
	): SchemaMerge<Id, Entries, EntryName, typeof type> {
		if (this.#types.has(name)) {
			throw new Error(
				`Schema with id ${this.#id} already has a property with name "${name}"`,
			);
		}

		this.#types.set(name, type);

		if (type.BIT_SIZE === null) {
			this.#bitSize = null;
		} else if (this.#bitSize !== null) {
			this.#bitSize += type.BIT_SIZE;
		}

		return this as unknown as SchemaMerge<Id, Entries, EntryName, typeof type>;
	}
}
