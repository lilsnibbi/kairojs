/**
 * Any of the four JavaScript/TypeScript primitive-ish leaf types plus `symbol`, `undefined` and
 * `null`. Used as the base case for the deep type helpers below.
 *
 * @since 1.0.0
 */
export type Primitive =
	| string
	| number
	| boolean
	| bigint
	| symbol
	| undefined
	| null;

/**
 * Every type that {@link DeepReadonly} and {@link DeepRequired} treat as a leaf instead of
 * recursing into — primitives plus the handful of built-ins that should never be walked key by key.
 *
 * @since 1.0.0
 */
// biome-ignore lint/complexity/noBannedTypes: any callable counts as a leaf, so the broad Function type is intended
export type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * Recursively makes every property of `T` readonly, including the contents of nested arrays, maps
 * and sets. Class instances and functions are left untouched.
 *
 * @since 1.0.0
 */
export type DeepReadonly<T> = T extends Builtin
	? T
	: T extends AbstractConstructor<unknown> | ((...args: any[]) => unknown)
		? T
		: T extends ReadonlyMap<infer K, infer V>
			? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
			: T extends ReadonlySet<infer U>
				? ReadonlySet<DeepReadonly<U>>
				: T extends readonly [] | readonly [...never[]]
					? readonly []
					: T extends readonly [infer U, ...infer V]
						? readonly [DeepReadonly<U>, ...DeepReadonly<V>]
						: T extends readonly [...infer U, infer V]
							? readonly [...DeepReadonly<U>, DeepReadonly<V>]
							: T extends ReadonlyArray<infer U>
								? ReadonlyArray<DeepReadonly<U>>
								: T extends object
									? { readonly [K in keyof T]: DeepReadonly<T[K]> }
									: unknown;

/**
 * Recursively strips `undefined`/`null` and marks every property (including nested maps, sets and
 * objects) as required. This is the return type of {@link mergeDefault}.
 *
 * @since 1.0.0
 */
export type DeepRequired<T> = T extends Builtin
	? NonNullable<T>
	: T extends Map<infer K, infer V>
		? Map<DeepRequired<K>, DeepRequired<V>>
		: T extends ReadonlyMap<infer K, infer V>
			? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
			: T extends WeakMap<infer K, infer V>
				? WeakMap<DeepRequired<K>, DeepRequired<V>>
				: T extends Set<infer U>
					? Set<DeepRequired<U>>
					: T extends ReadonlySet<infer U>
						? ReadonlySet<DeepRequired<U>>
						: T extends WeakSet<infer U>
							? WeakSet<DeepRequired<U>>
							: T extends Promise<infer U>
								? Promise<DeepRequired<U>>
								: T extends object
									? { [K in keyof T]-?: DeepRequired<T[K]> }
									: NonNullable<T>;

/**
 * Like {@link Partial}, but only the keys in `K` become optional — every other key keeps its
 * original requiredness.
 *
 * @since 1.0.0
 */
export type RequiredExcept<T, K extends keyof T> = Partial<Pick<T, K>> &
	Required<Omit<T, K>>;

/**
 * Like {@link Required}, but only the keys in `K` become required — every other key keeps its
 * original optionality.
 *
 * @since 1.0.0
 */
export type PartialRequired<T, K extends keyof T> = Partial<Omit<T, K>> &
	Required<Pick<T, K>>;

/**
 * Recursively makes every property of `T` optional, including the elements of nested arrays.
 *
 * @since 1.0.0
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer U>
		? Array<DeepPartial<U>>
		: T[P] extends ReadonlyArray<infer U>
			? ReadonlyArray<DeepPartial<U>>
			: DeepPartial<T[P]>;
};

/**
 * Extracts the tuple of parameter types from a function type.
 *
 * @since 1.0.0
 */
export type ArgumentTypes<F extends (...args: any[]) => unknown> = F extends (
	...args: infer A
) => any
	? A
	: never;

/**
 * A readonly array of any values, used as the default parameter-tuple bound for {@link Ctor} and
 * {@link AbstractCtor}.
 *
 * @since 1.0.0
 */
export type AnyReadonlyArray = readonly any[];

/**
 * A generic constructor type, parameterised over its constructor arguments and instance type.
 *
 * @since 1.0.0
 */
export type Ctor<A extends AnyReadonlyArray = readonly any[], R = any> = new (
	...args: A
) => R;

/**
 * A generic abstract constructor type, parameterised over its constructor arguments and instance
 * type.
 *
 * @since 1.0.0
 */
export type AbstractCtor<
	A extends AnyReadonlyArray = readonly any[],
	R = any,
> = abstract new (...args: A) => R;

/**
 * A generic constructor type for a class producing instances of `T`, ignoring its parameter list.
 *
 * @since 1.0.0
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * A generic abstract constructor type for a class producing instances of `T`, ignoring its
 * parameter list.
 *
 * @since 1.0.0
 */
export type AbstractConstructor<T> = abstract new (...args: any[]) => T;

/**
 * Extracts the type of the first parameter of a function type, or `unknown` if it cannot be
 * determined.
 *
 * @since 1.0.0
 */
export type FirstArgument<T> = T extends (
	arg1: infer U,
	...args: unknown[]
) => unknown
	? U
	: unknown;

/**
 * Extracts the type of the second parameter of a function type, or `unknown` if it cannot be
 * determined.
 *
 * @since 1.0.0
 */
export type SecondArgument<T> = T extends (
	arg1: unknown,
	arg2: infer U,
	...args: unknown[]
) => unknown
	? U
	: unknown;

/**
 * A value of type `T`, or a `Promise`/thenable that resolves to one — the return type accepted by
 * every callback in this package that may be sync or async.
 *
 * @since 1.0.0
 */
export type Awaitable<T> = PromiseLike<T> | T;

/**
 * The union of the two values commonly referred to as "the billion dollar mistake": `null` and
 * `undefined`.
 *
 * @since 1.0.0
 */
export type Nullish = null | undefined;

/**
 * Like the built-in {@link NonNullable}, but applies to every property of an object instead of a
 * single value. Does not recurse — see {@link DeepRequired} for that.
 *
 * @since 1.0.0
 */
export type NonNullableProperties<T = unknown> = {
	[P in keyof T]: NonNullable<T[P]>;
};

/**
 * Flattens an intersection of object types into a single object type, purely for readability of
 * hover tooltips and error messages — it has no effect on assignability.
 *
 * @example
 * ```typescript
 * type Combined = { foo: string; bar: number } & { hello: boolean };
 * type Pretty = PrettifyObject<Combined>;
 * // { foo: string; bar: number; hello: boolean }
 * ```
 *
 * @since 1.0.0
 */
export type PrettifyObject<T extends object> = {
	[K in keyof T]: T[K];
};

/**
 * Gets a union of the keys of `T` whose value type is assignable to `V`.
 *
 * @example
 * ```typescript
 * interface Sample {
 *   id: string;
 *   name: string | null;
 *   hobbies: readonly string[];
 * }
 *
 * type Ids = PickByValue<Sample, string>; // "id"
 * ```
 *
 * @since 1.0.0
 */
export type PickByValue<T, V> = {
	[P in keyof T]: T[P] extends V ? P : never;
}[keyof T] &
	keyof T;

/**
 * Recursively strips `readonly` from every property of `T`, including nested arrays and objects.
 *
 * @since 1.0.0
 */
export type Mutable<T> = {
	-readonly [P in keyof T]: T[P] extends Array<unknown> | object
		? Mutable<T[P]>
		: T[P];
};

/**
 * Makes every property of `T` required and strips `null`/`undefined` from each of their types.
 * Unlike {@link DeepRequired}, this does not recurse into nested objects.
 *
 * @since 1.0.0
 */
export type StrictRequired<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Gets the union of element types of an array or readonly array type, or `T` itself when it is
 * not an array.
 *
 * @since 1.0.0
 */
export type ArrayElementType<T> = T extends (infer K)[]
	? K
	: T extends readonly (infer RK)[]
		? RK
		: T;

/**
 * Resolves to `TrueResult` when `Value` is `true`, `FalseResult` when it is `false`, or the union
 * of both when `Value` is the general `boolean` type.
 *
 * @since 1.0.0
 */
export type If<
	Value extends boolean,
	TrueResult,
	FalseResult,
> = Value extends true
	? TrueResult
	: Value extends false
		? FalseResult
		: TrueResult | FalseResult;

/**
 * Branches a type on a boolean generic: `ValueType` when `Value` is `true`, otherwise the union
 * of `ValueType` and `FallbackType`.
 *
 * @since 1.0.0
 */
export type RequiredIf<
	Value extends boolean,
	ValueType,
	FallbackType = null,
> = If<Value, ValueType, ValueType | FallbackType>;

/**
 * The union of every built-in typed array class. TypeScript does not expose the ECMAScript
 * `%TypedArray%` intrinsic directly, so this union stands in for it wherever a value needs to be
 * checked against any typed array instance, such as inside {@link deepClone}.
 *
 * @since 1.0.0
 */
export type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array;

/**
 * The shape checked by {@link isThenable}: an object exposing both `then` and `catch` methods.
 *
 * @since 1.0.0
 */
export interface Thenable {
	// biome-ignore lint/complexity/noBannedTypes: the guard only asserts the members are callable
	then: Function;
	// biome-ignore lint/complexity/noBannedTypes: the guard only asserts the members are callable
	catch: Function;
}

/**
 * Options accepted by {@link getDeepObjectKeys}.
 *
 * @since 1.0.0
 */
export interface GetDeepObjectKeysOptions {
	/**
	 * Controls how array indices are rendered when building a nested key path: `"dotted"` produces
	 * `arrayKey.0.subKey`, `"braces-with-dot"` produces `arrayKey[0].subKey`, and `"braces"`
	 * produces `arrayKey[0]subKey`.
	 *
	 * @default "dotted"
	 */
	arrayKeysIndexStyle?: "dotted" | "braces-with-dot" | "braces";
}

/**
 * Options accepted by {@link sleep}.
 *
 * @since 1.0.0
 */
export interface SleepOptions {
	/**
	 * Aborting this signal rejects the sleep's promise with the signal's abort reason instead of
	 * waiting out the remaining time.
	 */
	signal?: AbortSignal | undefined;

	/**
	 * Set to `false` to allow the process to exit while this sleep is still pending, instead of the
	 * scheduled timer keeping the event loop alive.
	 *
	 * @default true
	 */
	ref?: boolean | undefined;
}

/**
 * Options accepted by {@link poll}.
 *
 * @since 1.0.0
 */
export interface PollOptions {
	/**
	 * Aborting this signal stops the polling loop and rejects with the signal's abort reason.
	 */
	signal?: AbortSignal | undefined;

	/**
	 * The maximum number of additional attempts to make after the first call.
	 *
	 * @default Infinity
	 */
	maximumRetries?: number | null | undefined;

	/**
	 * How long to wait, in milliseconds, between each attempt.
	 *
	 * @default 0
	 */
	waitBetweenRetries?: number | null | undefined;

	/**
	 * Whether to log a message to the console before each wait, useful for tracing how many
	 * attempts a call needed.
	 *
	 * @default false
	 */
	verbose?: boolean | undefined;
}

/**
 * Options accepted by {@link pollSync}. Identical to {@link PollOptions} minus the abort signal,
 * plus an overall timeout since a synchronous loop has no signal to cancel it early.
 *
 * @since 1.0.0
 */
export interface SyncPollOptions extends Omit<PollOptions, "signal"> {
	/**
	 * The number of milliseconds after which polling gives up and throws an `AbortError`.
	 *
	 * @default Infinity
	 */
	timeout?: number | null | undefined;
}

/**
 * The settings accepted by {@link debounce}.
 *
 * @since 1.0.0
 */
export interface DebounceSettings {
	/**
	 * The number of milliseconds to delay invocation by.
	 *
	 * @default 0
	 */
	wait?: number;

	/**
	 * The maximum time the wrapped function is allowed to be delayed before it is invoked
	 * regardless of further calls.
	 *
	 * @default null
	 */
	maxWait?: number | null;
}

/**
 * The debounced wrapper function returned by {@link debounce}.
 *
 * @since 1.0.0
 */
export interface DebouncedFunc<FnArgumentsType extends any[], FnReturnType> {
	/**
	 * Invokes the underlying function subject to the debounce rules, returning either its fresh
	 * return value (if this call runs immediately) or the return value of the last invocation.
	 */
	(...args: FnArgumentsType): FnReturnType | undefined;

	/**
	 * Discards any pending invocation without running it.
	 */
	cancel(): void;

	/**
	 * Immediately runs a pending invocation, if any, and returns its result — or the last known
	 * result when nothing is pending.
	 */
	flush(): FnReturnType | undefined;
}

/**
 * A throttled wrapper function, as returned by {@link throttle}: the original function's call
 * signature plus a `flush` method that resets its internal cooldown.
 *
 * @since 1.0.0
 */
export type ThrottleFn<T extends (...args: any[]) => any> = T & {
	flush: () => void;
};

/**
 * Options accepted by {@link toTitleCase}.
 *
 * @since 1.0.0
 */
export interface ToTitleCaseOptions {
	/**
	 * Extra lowercase-word-to-titlecased-word mappings to merge with the built-in
	 * `discord.js`-flavoured variants.
	 */
	additionalVariants?: Record<string, string>;

	/**
	 * Whether variant lookups are case sensitive. When `false` (the default), both the built-in
	 * variants and `additionalVariants` keys are matched case-insensitively.
	 */
	caseSensitive?: boolean;
}
