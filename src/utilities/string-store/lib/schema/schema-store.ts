import type {
	DeserializationResult,
	DuplexBuffer,
	EntryOfStore,
	KeyOfStore,
	SchemaStoreMerge,
	SerializeValue,
	ValueOfStore,
} from "@types";
import { UnalignedUint16Array } from "../buffer/unaligned-uint16-array.ts";
import { Pointer } from "../shared/pointer.ts";
import type { Schema } from "./schema.ts";

/**
 * Holds a collection of {@link Schema}s keyed by their numeric identifier, and dispatches
 * serialization and deserialization to whichever schema a value belongs to.
 *
 * Every serialized string produced through a store carries its schema's identifier ahead of the
 * data itself, so {@link SchemaStore.deserialize} can recover the right schema without the caller
 * having to track it separately.
 *
 * @typeparam Entries The accumulated map of schema id to schema, built up by chaining
 * {@link SchemaStore.add}.
 *
 * @since 1.0.0
 */
export class SchemaStore<Entries extends object = object> {
	/**
	 * The buffer capacity newly added schemas fall back to when their {@link Schema.totalBitSize} is
	 * variable.
	 */
	public defaultMaximumArrayLength: number;

	readonly #schemas = new Map<number, Schema>();

	/**
	 * @param defaultMaximumArrayLength The default fallback buffer capacity for schemas with a
	 * variable bit size. Defaults to `100`.
	 */
	public constructor(defaultMaximumArrayLength = 100) {
		this.defaultMaximumArrayLength = defaultMaximumArrayLength;
	}

	/**
	 * Registers a schema, returning `this` widened to include it.
	 *
	 * @param schema The schema to register.
	 * @throws {Error} If a schema with the same identifier is already registered.
	 */
	public add<const Id extends number, const SchemaType extends object>(
		schema: Schema<Id, SchemaType>,
	): SchemaStoreMerge<Entries, Id, typeof schema> {
		if (this.#schemas.has(schema.id)) {
			throw new Error(`Schema with id ${schema.id} already exists`);
		}

		this.#schemas.set(schema.id, schema as any);
		return this as unknown as SchemaStoreMerge<Entries, Id, typeof schema>;
	}

	/**
	 * Retrieves the schema registered under the given identifier.
	 *
	 * @param id The schema identifier to look up.
	 * @throws {Error} If no schema with that identifier is registered.
	 */
	public get<const Id extends KeyOfStore<this>>(id: Id): Entries[Id] {
		const schema = this.#schemas.get(id) as Entries[Id];
		if (!schema) throw new Error(`Schema with id ${id} does not exist`);
		return schema;
	}

	/**
	 * Serializes the given value using the schema registered under `id`, rendered to a string.
	 *
	 * @param id The identifier of the schema to serialize with.
	 * @param value The value to serialize.
	 */
	public serialize<const Id extends KeyOfStore<this>>(
		id: Id,
		value: SerializeValue<Entries[Id] & object>,
	): string {
		return this.serializeRaw(id, value).toString();
	}

	/**
	 * Serializes the given value using the schema registered under `id`.
	 *
	 * @param id The identifier of the schema to serialize with.
	 * @param value The value to serialize.
	 */
	public serializeRaw<const Id extends KeyOfStore<this>>(
		id: Id,
		value: SerializeValue<Entries[Id] & object>,
	): DuplexBuffer {
		const schema = this.get(id) as Schema<Id, object>;
		return schema.serializeRaw(value, this.defaultMaximumArrayLength);
	}

	/**
	 * Deserializes a buffer, reading its schema identifier first and dispatching to the matching
	 * registered schema.
	 *
	 * @param buffer The buffer, or its string rendering, to deserialize.
	 */
	public deserialize(
		buffer: string | DuplexBuffer,
	): DeserializationResult<Entries> {
		buffer = UnalignedUint16Array.from(buffer);
		const pointer = new Pointer();
		const id = buffer.readInt16(pointer) as KeyOfStore<this>;
		const schema = this.get(id) as Schema<number, object>;
		return {
			id,
			data: schema.deserialize(buffer, pointer),
		} as unknown as DeserializationResult<Entries>;
	}

	/**
	 * Reads only the schema identifier out of a buffer, without deserializing the rest of it.
	 *
	 * @param buffer The buffer, or its string rendering, to read the identifier from.
	 * @throws {RangeError} If an empty value is given.
	 */
	public getIdentifier(buffer: string | DuplexBuffer): KeyOfStore<this> {
		if (buffer.length === 0) {
			throw new RangeError("Expected a non-empty value");
		}

		if (typeof buffer === "string") {
			// Only the first character needs to be read:
			buffer = UnalignedUint16Array.from(buffer[0]!);
		}

		return buffer.at(0) as KeyOfStore<this>;
	}

	/**
	 * Iterates the store's registered schema identifiers.
	 */
	public keys(): IterableIterator<KeyOfStore<this>> {
		return this.#schemas.keys() as IterableIterator<KeyOfStore<this>>;
	}

	/**
	 * Iterates the store's registered schemas.
	 */
	public values(): IterableIterator<ValueOfStore<this>> {
		return this.#schemas.values() as IterableIterator<ValueOfStore<this>>;
	}

	/**
	 * Iterates the store's `[id, schema]` entries.
	 */
	public entries(): IterableIterator<EntryOfStore<this>> {
		return this.#schemas.entries() as IterableIterator<EntryOfStore<this>>;
	}

	public [Symbol.iterator](): IterableIterator<EntryOfStore<this>> {
		return this.entries();
	}
}
