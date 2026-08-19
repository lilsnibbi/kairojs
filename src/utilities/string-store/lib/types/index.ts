import { ArrayType } from "./array.ts";
import { BigInt32Type } from "./big-int32.ts";
import { BigInt64Type } from "./big-int64.ts";
import { BigUint32Type } from "./big-uint32.ts";
import { BigUint64Type } from "./big-uint64.ts";
import { BitType } from "./bit.ts";
import { BooleanType } from "./boolean.ts";
import { ConstantType } from "./constant.ts";
import { FixedLengthArrayType } from "./fixed-length-array.ts";
import { Float32Type } from "./float32.ts";
import { Float64Type } from "./float64.ts";
import { Int2Type } from "./int2.ts";
import { Int4Type } from "./int4.ts";
import { Int8Type } from "./int8.ts";
import { Int16Type } from "./int16.ts";
import { Int32Type } from "./int32.ts";
import { Int64Type } from "./int64.ts";
import { NullableType } from "./nullable.ts";
import { SnowflakeType } from "./snowflake.ts";
import { StringType } from "./string.ts";
import { Uint2Type } from "./uint2.ts";
import { Uint4Type } from "./uint4.ts";
import { Uint8Type } from "./uint8.ts";
import { Uint16Type } from "./uint16.ts";
import { Uint32Type } from "./uint32.ts";
import { Uint64Type } from "./uint64.ts";

/**
 * Every {@link IType} builder and constant, keyed by the short name {@link Schema}'s builder
 * methods use internally.
 *
 * @since 1.0.0
 */
export const t = {
	array: ArrayType,
	bigInt32: BigInt32Type,
	bigInt64: BigInt64Type,
	bigUint32: BigUint32Type,
	bigUint64: BigUint64Type,
	bit: BitType,
	boolean: BooleanType,
	constant: ConstantType,
	fixedLengthArray: FixedLengthArrayType,
	float32: Float32Type,
	float64: Float64Type,
	int16: Int16Type,
	int2: Int2Type,
	int32: Int32Type,
	int4: Int4Type,
	int64: Int64Type,
	int8: Int8Type,
	nullable: NullableType,
	snowflake: SnowflakeType,
	string: StringType,
	uint16: Uint16Type,
	uint2: Uint2Type,
	uint32: Uint32Type,
	uint4: Uint4Type,
	uint64: Uint64Type,
	uint8: Uint8Type,
};

export {
	ArrayType,
	BigInt32Type,
	BigInt64Type,
	BigUint32Type,
	BigUint64Type,
	BitType,
	BooleanType,
	ConstantType,
	FixedLengthArrayType,
	Float32Type,
	Float64Type,
	Int16Type,
	Int2Type,
	Int32Type,
	Int4Type,
	Int64Type,
	Int8Type,
	NullableType,
	SnowflakeType,
	StringType,
	Uint16Type,
	Uint2Type,
	Uint32Type,
	Uint4Type,
	Uint64Type,
	Uint8Type,
};
