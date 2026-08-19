import { describe, expect, expectTypeOf, mock, test } from "bun:test";
import type {
	AnyOption,
	Awaitable,
	Err,
	None,
	Ok,
	OptionResolvable,
	Some,
} from "@types";
import {
	err,
	none,
	ok,
	Option,
	OptionError,
	some,
} from "@utilities/result/index.ts";
import { error, makeThrow } from "./shared.ts";

describe("Option", () => {
	describe("prototype", () => {
		describe("isSome", () => {
			test("GIVEN some THEN always returns true", () => {
				const x = some(2);
				expect<boolean>(x.isSome()).toBe(true);
			});

			test("GIVEN none THEN always returns false", () => {
				const x = none;
				expect<boolean>(x.isSome()).toBe(false);
			});
		});

		describe("isSomeAnd", () => {
			test("GIVEN some AND true-returning callback THEN returns true", () => {
				const x = some(2);
				const callback = mock((value: number) => value > 1);

				expect(x.isSomeAnd(callback)).toBe(true);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN some AND false-returning callback THEN returns false", () => {
				const x = some(0);
				const callback = mock((value: number) => value > 1);

				expect(x.isSomeAnd(callback)).toBe(false);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(0);
				expect(callback).toHaveLastReturnedWith(false);
			});

			test("GIVEN none THEN always returns false", () => {
				const x = none;
				const callback = mock((value: number) => value > 1);

				expect(x.isSomeAnd(callback)).toBe(false);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("isNone", () => {
			test("GIVEN some THEN always returns false", () => {
				const x = some(2);
				expect<boolean>(x.isNone()).toBe(false);
			});

			test("GIVEN none THEN always returns true", () => {
				const x = none;
				expect<boolean>(x.isNone()).toBe(true);
			});
		});

		describe("isNoneOr", () => {
			test("GIVEN some AND true-returning callback THEN returns true", () => {
				const x = some(2);
				const callback = mock((value: number) => value > 1);

				expect(x.isNoneOr(callback)).toBe(true);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN some AND false-returning callback THEN returns false", () => {
				const x = some(0);
				const callback = mock((value: number) => value > 1);

				expect(x.isNoneOr(callback)).toBe(false);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(0);
				expect(callback).toHaveLastReturnedWith(false);
			});

			test("GIVEN none THEN always returns true", () => {
				const x = none;
				const callback = mock((value: number) => value > 1);

				expect(x.isNoneOr(callback)).toBe(true);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("expect", () => {
			test("GIVEN some THEN returns value", () => {
				const x = some(2);

				expect<number>(x.expect("Whoops!")).toBe(2);
			});

			test("GIVEN none THEN throws OptionError", () => {
				const x = none;

				expectOptionError("Whoops!", () => x.expect("Whoops!"));
			});
		});

		describe("unwrap", () => {
			test("GIVEN some THEN returns value", () => {
				const x = some(2);

				expect<number>(x.unwrap()).toBe(2);
			});

			test("GIVEN none THEN throws OptionError", () => {
				const x = none;

				expectOptionError("Unwrap failed", () => x.unwrap());
			});
		});

		describe("unwrapOr", () => {
			test("GIVEN some THEN returns value", () => {
				const x = some(2);

				expect<number>(x.unwrapOr(5)).toBe(2);
			});

			test("GIVEN none THEN returns default", () => {
				const x = none;

				expect<5>(x.unwrapOr(5)).toBe(5);
			});

			test("GIVEN Option<T> THEN returns union", () => {
				const x = some(2) as Option<number>;

				expect<number | null>(x.unwrapOr(null)).toBe(2);
			});
		});

		describe("unwrapOrElse", () => {
			test("GIVEN some THEN returns value", () => {
				const x = some(2);

				expect<number>(x.unwrapOrElse(() => 5)).toBe(2);
			});

			test("GIVEN none THEN returns default", () => {
				const x = none;

				expect<5>(x.unwrapOrElse(() => 5)).toBe(5);
			});

			test("GIVEN Option<T> THEN returns union", () => {
				const x = some(2) as Option<number>;

				expect<number | null>(x.unwrapOrElse(() => null)).toBe(2);
			});
		});

		describe("map", () => {
			test("GIVEN some THEN returns mapped value", () => {
				const x = some("Hello, world!");
				const operation = mock((value: string) => value.length);

				expect<Some<number>>(x.map(operation)).toEqual(some(13));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith("Hello, world!");
				expect(operation).toHaveLastReturnedWith(13);
			});

			test("GIVEN none THEN returns self", () => {
				const x = none;
				const operation = mock((value: string) => value.length);

				expect<None>(x.map(operation)).toBe(none);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN option THEN chain map THEN returns Option<string>", () => {
				const x = Option.from(5);
				const callback = mock((value: number) => `${value}`);
				const mapChain = x.map(callback);

				expectTypeOf(mapChain).toExtend<Option<string>>();
				expect<Option<string>>(mapChain).toEqual(some("5"));
			});
		});

		describe("mapInto", () => {
			test("GIVEN some THEN returns mapped option", () => {
				const x = some("Hello, world!");
				const operation = mock((value: string) => some(value.length));

				expect<Some<number>>(x.mapInto(operation)).toEqual(some(13));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith("Hello, world!");
				expect(operation).toHaveLastReturnedWith(some(13));
			});

			test("GIVEN none THEN returns itself", () => {
				const x = none;
				const operation = mock((value: string) => some(value.length));

				expect<AnyOption>(x.mapInto(operation)).toBe(none);
				expect(operation).not.toHaveBeenCalled();
			});
		});

		describe("mapOr", () => {
			test("GIVEN some THEN returns mapped value", () => {
				const x = some("Hello, world!");
				const operation = mock((value: string) => value.length);

				expect<number>(x.mapOr(5, operation)).toEqual(13);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith("Hello, world!");
				expect(operation).toHaveLastReturnedWith(13);
			});

			test("GIVEN none THEN returns default value", () => {
				const x = none;
				const operation = mock((value: string) => value.length);

				expect<number>(x.mapOr(5, operation)).toBe(5);
				expect(operation).not.toHaveBeenCalled();
			});
		});

		describe("mapOrElse", () => {
			test("GIVEN some THEN returns mapped value", () => {
				const x = some("Hello, world!");
				const operation = mock((value: string) => value.length);
				const fallback = mock(() => 5);

				expect<number>(x.mapOrElse(fallback, operation)).toEqual(13);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith("Hello, world!");
				expect(operation).toHaveLastReturnedWith(13);
				expect(fallback).not.toHaveBeenCalled();
			});

			test("GIVEN none THEN returns default value", () => {
				const x = none;
				const operation = mock((value: string) => value.length);
				const fallback = mock(() => 5);

				expect<number>(x.mapOrElse(fallback, operation)).toBe(5);
				expect(fallback).toHaveBeenCalledTimes(1);
				expect(fallback).toHaveBeenCalledWith();
				expect(fallback).toHaveLastReturnedWith(5);
				expect(operation).not.toHaveBeenCalled();
			});
		});

		describe("mapNoneInto", () => {
			test("GIVEN some THEN returns itself", () => {
				const x = some("Hello, world!");
				const operation = mock(() => some(13));

				expect<Some<string>>(x.mapNoneInto(operation)).toBe(x);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN none THEN returns mapped option", () => {
				const x = none;
				const operation = mock(() => some(13));

				expect<Some<number>>(x.mapNoneInto(operation)).toEqual(some(13));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveLastReturnedWith(some(13));
			});
		});

		describe("inspect", () => {
			test("GIVEN some THEN calls callback and returns self", () => {
				const x = some(2);
				const callback = mock();

				expect<typeof x>(x.inspect(callback)).toBe(x);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
			});

			test("GIVEN none THEN returns self", () => {
				const x = none;
				const callback = mock();

				expect<typeof x>(x.inspect(callback)).toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("inspectAsync", () => {
			test("GIVEN some THEN calls callback and returns self", async () => {
				const x = some(2);
				let finished = false;
				const callback = mock(() => Bun.sleep(5).then(() => (finished = true)));

				await expect<Promise<typeof x>>(x.inspectAsync(callback)).resolves.toBe(
					x,
				);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(finished).toBe(true);
			});

			test("GIVEN none THEN returns self", async () => {
				const x = none;
				const callback = mock();

				await expect<Promise<typeof x>>(x.inspectAsync(callback)).resolves.toBe(
					x,
				);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("okOr", () => {
			test("GIVEN some(s) THEN returns ok(s)", () => {
				const x = some("hello");

				expect<Ok<string>>(x.okOr(0)).toEqual(ok("hello"));
			});

			test("GIVEN none THEN returns err(default)", () => {
				const x = none;

				expect<Err<number>>(x.okOr(0)).toEqual(err(0));
			});
		});

		describe("okOrElse", () => {
			test("GIVEN some(s) THEN returns ok(s)", () => {
				const x = some("hello");
				const operation = mock(() => 0);

				expect<Ok<string>>(x.okOrElse(operation)).toEqual(ok("hello"));
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN none THEN returns err(default)", () => {
				const x = none;
				const operation = mock(() => 0);

				expect<Err<number>>(x.okOrElse(operation)).toEqual(err(0));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith();
				expect(operation).toHaveLastReturnedWith(0);
			});
		});

		describe("iter", () => {
			test("GIVEN some THEN yields one value", () => {
				const x = some(2);

				expect<number[]>([...x.iter()]).toStrictEqual([2]);
			});

			test("GIVEN none THEN yields no values", () => {
				const x = none;

				expect<number[]>([...x.iter()]).toStrictEqual([]);
			});
		});

		describe("and", () => {
			test("GIVEN x=some and y=some THEN returns y", () => {
				const x = some(2);
				const y = some("Hello");

				expect<typeof y>(x.and(y)).toBe(y);
			});

			test("GIVEN x=some and y=none THEN returns y", () => {
				const x = some(2);
				const y = none;

				expect<typeof y>(x.and(y)).toBe(y);
			});

			test("GIVEN x=none and y=some THEN returns x", () => {
				const x = none;
				const y = some("Hello");

				expect<typeof x>(x.and(y)).toBe(x);
			});

			test("GIVEN x=none and y=none THEN returns x", () => {
				const x = none;
				const y = none;

				expect<typeof x>(x.and(y)).toBe(x);
			});
		});

		describe("andThen", () => {
			const divide = (value: number) => (value === 0 ? none : some(4 / value));

			test("GIVEN some AND some-returning callback THEN returns some", () => {
				const x = some(4);
				const operation = mock(divide);

				expect<Option<number>>(x.andThen(operation)).toEqual(some(1));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(4);
				expect(operation).toHaveLastReturnedWith(some(1));
			});

			test("GIVEN some AND none-returning callback THEN returns none", () => {
				const x = some(0);
				const operation = mock(divide);

				expect<Option<number>>(x.andThen(operation)).toEqual(none);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(0);
				expect(operation).toHaveLastReturnedWith(none);
			});

			test("GIVEN none THEN always returns none", () => {
				const x = none;
				const operation = mock(divide);

				expect(x.andThen(operation)).toBe(none);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN option THEN andThen and chain map THEN returns Option<number>", () => {
				const x = Option.from(5);
				const callback = mock((value: number) => some(`${value}`));
				const mapChain = x.andThen(callback).map((value) => Number(value));

				expectTypeOf(mapChain).toExtend<Option<number>>();
				expect<Option<number>>(mapChain).toEqual(some(5));
			});
		});

		describe("or", () => {
			test("GIVEN x=some and y=some THEN returns x", () => {
				const x = some(2);
				const y = some(100);

				expect<typeof x>(x.or(y)).toBe(x);
			});

			test("GIVEN x=some and y=none THEN returns x", () => {
				const x = some(2);
				const y = none;

				expect<typeof x>(x.or(y)).toBe(x);
			});

			test("GIVEN x=none and y=some THEN returns y", () => {
				const x = none;
				const y = some(2);

				expect<typeof y>(x.or(y)).toBe(y);
			});

			test("GIVEN x=none and y=none THEN returns y", () => {
				const x = none;
				const y = none;

				expect<typeof y>(x.or(y)).toBe(y);
			});
		});

		describe("orElse", () => {
			const nobody = () => none;
			const vikings = () => some("vikings");

			test("GIVEN some AND some-returning callback THEN returns self", () => {
				const x = some("barbarians");
				const operation = mock(vikings);

				expect<typeof x>(x.orElse(operation)).toBe(x);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN none AND some-returning callback THEN returns some", () => {
				const x = none;
				const operation = mock(vikings);

				expect<Some<string>>(x.orElse(operation)).toEqual(some("vikings"));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith();
				expect(operation).toHaveLastReturnedWith(some("vikings"));
			});

			test("GIVEN none AND none-returning callback THEN returns none", () => {
				const x = none;
				const operation = mock(nobody);

				expect<None>(x.orElse(operation)).toEqual(none);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith();
				expect(operation).toHaveLastReturnedWith(none);
			});
		});

		describe("xor", () => {
			test("GIVEN x=some(s), y=some(t) / s !== t THEN returns none", () => {
				const x = some(2);
				const y = some(3);

				expect<None>(x.xor(y)).toEqual(none);
			});

			test("GIVEN x=some(s), y=none THEN returns some(s)", () => {
				const x = some(2);
				const y = none;

				expect<typeof x>(x.xor(y)).toBe(x);
			});

			test("GIVEN x=none, y=some(t) THEN returns some(t)", () => {
				const x = none;
				const y = some(3);

				expect<typeof y>(x.xor(y)).toBe(y);
			});

			test("GIVEN x=none, y=none THEN returns none", () => {
				const x = none;
				const y = none;

				expect<None>(x.xor(y)).toEqual(none);
			});
		});

		describe("filter", () => {
			const isEven = (value: number) => value % 2 === 0;

			test("GIVEN some(s) AND true-returning callback THEN returns some(s)", () => {
				const x = some(4);
				const operation = mock(isEven);

				expect(x.filter(operation)).toBe(x);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(4);
				expect(operation).toHaveLastReturnedWith(true);
			});

			test("GIVEN some(s) AND false-returning callback THEN returns none", () => {
				const x = some(3);
				const operation = mock(isEven);

				expect(x.filter(operation)).toEqual(none);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(3);
				expect(operation).toHaveLastReturnedWith(false);
			});

			test("GIVEN none THEN always returns none", () => {
				const x = none;
				const operation = mock(isEven);

				expect(x.filter(operation)).toEqual(none);
				expect(operation).not.toHaveBeenCalled();
			});
		});

		describe("contains", () => {
			test("GIVEN some(s), s THEN returns true", () => {
				const x = some(2);

				expect<boolean>(x.contains(2)).toBe(true);
			});

			test("GIVEN some(s), t / s !== t THEN returns false", () => {
				const x = some(2);

				expect<boolean>(x.contains(3)).toBe(false);
			});

			test("GIVEN none THEN always returns false", () => {
				const x = none;

				expect<boolean>(x.contains(2)).toBe(false);
			});
		});

		describe("zip", () => {
			test("GIVEN x=some(s), y=some(t) THEN always returns some([s, t])", () => {
				const x = some(1);
				const y = some("hi");

				expect<Some<[number, string]>>(x.zip(y)).toEqual(some([1, "hi"]));
			});

			test("GIVEN x=some(s), y=none THEN always returns none", () => {
				const x = some(1);
				const y = none;

				expect<None>(x.zip(y)).toEqual(none);
			});

			test("GIVEN x=none, y=some(t) THEN always returns none", () => {
				const x = none;
				const y = some("hi");

				expect<None>(x.zip(y)).toEqual(none);
			});

			test("GIVEN x=none, y=none THEN always returns none", () => {
				const x = none;
				const y = none;

				expect<None>(x.zip(y)).toEqual(none);
			});
		});

		describe("zipWith", () => {
			const multiply = (left: number, right: number) => left * right;

			test("GIVEN x=some, y=some THEN always returns some", () => {
				const x = some(2);
				const y = some(4);
				const operation = mock(multiply);

				expect<Some<number>>(x.zipWith(y, operation)).toEqual(some(8));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(2, 4);
				expect(operation).toHaveLastReturnedWith(8);
			});

			test("GIVEN x=some, y=none THEN always returns none", () => {
				const x = some(2);
				const y = none;
				const operation = mock(multiply);

				expect<None>(x.zipWith(y, operation)).toEqual(none);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN x=none, y=some THEN always returns none", () => {
				const x = none;
				const y = some(4);
				const operation = mock(multiply);

				expect<None>(x.zipWith(y, operation)).toEqual(none);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN x=none, y=none THEN always returns none", () => {
				const x = none;
				const y = none;
				const operation = mock(multiply);

				expect<None>(x.zipWith(y, operation)).toEqual(none);
				expect(operation).not.toHaveBeenCalled();
			});
		});

		describe("unzip", () => {
			test("GIVEN some([s, t]) THEN always returns [some(s), some(t)]", () => {
				const x = some([1, "hi"] as const);

				expect<[Some<1>, Some<"hi">]>(x.unzip()).toEqual([some(1), some("hi")]);
			});

			test("GIVEN none THEN always returns [none, none]", () => {
				const x = none;

				expect<[None, None]>(x.unzip()).toEqual([none, none]);
			});
		});

		describe("transpose", () => {
			test("GIVEN some(ok(s)) THEN returns ok(some(s))", () => {
				const x = some(ok(5));

				expect(x.transpose()).toEqual(ok(some(5)));
			});

			test("GIVEN some(err(e)) THEN returns err(e)", () => {
				const x = some(err("Some error message"));

				expect(x.transpose()).toEqual(err("Some error message"));
			});

			test("GIVEN none THEN returns ok(none)", () => {
				const x = none;

				expect<Ok<None>>(x.transpose()).toEqual(ok(none));
			});
		});

		describe("flatten", () => {
			test("GIVEN some(some(s)) THEN returns some(s)", () => {
				const x = some(some(3));

				expect<Some<number>>(x.flatten()).toEqual(some(3));
			});

			test("GIVEN some(none) THEN returns none", () => {
				const x = some(none);

				expect<None>(x.flatten()).toEqual(none);
			});

			test("GIVEN none THEN returns self", () => {
				const x = none;

				expect<typeof x>(x.flatten()).toBe(x);
			});
		});

		describe("intoPromise", () => {
			test("GIVEN some(Promise(s)) THEN returns Promise(some(s))", async () => {
				const x = some(Promise.resolve(3));

				await expect<Promise<Some<number>>>(x.intoPromise()).resolves.toEqual(
					some(3),
				);
			});

			test("GIVEN none THEN returns Promise(none)", async () => {
				const x = none;

				await expect<Promise<None>>(x.intoPromise()).resolves.toEqual(none);
			});
		});

		describe("eq", () => {
			test("GIVEN x=some(s), y=some(s) THEN returns true", () => {
				const x = some(3);
				const y = some(3);

				expect<boolean>(x.eq(y)).toBe(true);
			});

			test("GIVEN x=some(s), y=some(t) / s !== t THEN returns false", () => {
				const x = some(3);
				const y = some(4);

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=some(s), y=none THEN always returns false", () => {
				const x = some(3);
				const y = none;

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=none, y=some(t) THEN always returns false", () => {
				const x = none;
				const y = some(4);

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=none, y=none THEN returns true", () => {
				const x = none;
				const y = none;

				expect<boolean>(x.eq(y)).toBe(true);
			});
		});

		describe("ne", () => {
			test("GIVEN x=some(s), y=some(s) THEN returns false", () => {
				const x = some(3);
				const y = some(3);

				expect<boolean>(x.ne(y)).toBe(false);
			});

			test("GIVEN x=some(s), y=some(t) / s !== t THEN returns true", () => {
				const x = some(3);
				const y = some(4);

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=some(s), y=none THEN always returns true", () => {
				const x = some(3);
				const y = none;

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=none, y=some(t) THEN always returns true", () => {
				const x = none;
				const y = some(4);

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=none, y=none THEN always returns false", () => {
				const x = none;
				const y = none;

				expect<boolean>(x.ne(y)).toBe(false);
			});
		});

		describe("match", () => {
			test("GIVEN some THEN calls some callback", () => {
				const x = Option.some(2);
				const onSome = mock((value: number) => value * 2);
				const onNone = mock(() => 0);

				expect<number>(x.match({ some: onSome, none: onNone })).toBe(4);
				expect(onSome).toHaveBeenCalledTimes(1);
				expect(onSome).toHaveBeenCalledWith(2);
				expect(onSome).toHaveLastReturnedWith(4);
				expect(onNone).not.toHaveBeenCalled();
			});

			test("GIVEN none THEN calls none callback", () => {
				const x = Option.none;
				const onSome = mock((value: number) => value * 2);
				const onNone = mock(() => 0);

				expect<number>(x.match({ some: onSome, none: onNone })).toBe(0);
				expect(onSome).not.toHaveBeenCalled();
				expect(onNone).toHaveBeenCalledTimes(1);
				expect(onNone).toHaveBeenCalledWith();
				expect(onNone).toHaveLastReturnedWith(0);
			});
		});
	});

	describe("some", () => {
		test("GIVEN some without an argument THEN returns Some<undefined>", () => {
			const x = some();

			expectTypeOf(x).toExtend<Some<undefined>>();
			expect(x.isSome()).toBe(true);
			expect(x.isNone()).toBe(false);
		});

		test("GIVEN some with an argument THEN returns Some<T>", () => {
			const x = some(42);

			expectTypeOf(x).toExtend<Some<number>>();
			expect(x.isSome()).toBe(true);
			expect(x.isNone()).toBe(false);
		});
	});

	describe("none", () => {
		test("GIVEN none THEN returns None", () => {
			const x = none;

			expect(x.isSome()).toBe(false);
			expect(x.isNone()).toBe(true);
		});
	});

	describe("from", () => {
		const { from } = Option;

		test.each<
			[string, OptionResolvable<number> | (() => OptionResolvable<number>)]
		>([
			["T", 42],
			["Some(T)", some(42)],
			["() => T", () => 42],
			["() => Some(T)", () => some(42)],
		])("GIVEN from(%s) THEN returns Some(T)", (_, resolvable) => {
			const x = from(resolvable);

			expect(x).toStrictEqual(some(42));
		});

		test.each<
			[string, OptionResolvable<number> | (() => OptionResolvable<number>)]
		>([
			["null", null],
			["None", none],
			["() => null", () => null],
			["() => None", () => none],
			["() => throw", makeThrow],
		])("GIVEN from(%s) THEN returns None", (_, resolvable) => {
			const x = from(resolvable);

			expect(x).toStrictEqual(none);
		});
	});

	describe("fromAsync", () => {
		const { fromAsync } = Option;

		test.each<
			[
				string,
				(
					| Awaitable<OptionResolvable<number>>
					| (() => Awaitable<OptionResolvable<number>>)
				),
			]
		>([
			["T", 42],
			["Promise.resolve(T)", Promise.resolve(42)],
			["Some(T)", some(42)],
			["Promise.resolve(Some(T))", Promise.resolve(some(42))],
			["() => T", () => 42],
			["() => Some(T)", () => some(42)],
			["() => Promise.resolve(T)", () => Promise.resolve(42)],
			["() => Promise.resolve(Some(T))", () => Promise.resolve(some(42))],
		])("GIVEN fromAsync(%s) THEN returns Some(T)", async (_, resolvable) => {
			const x = await fromAsync(resolvable);

			expect(x).toStrictEqual(some(42));
		});

		test.each<
			[
				string,
				(
					| Awaitable<OptionResolvable<number>>
					| (() => Awaitable<OptionResolvable<number>>)
				),
			]
		>([
			["null", null],
			["None", none],
			["() => null", () => null],
			["() => Promise.resolve(null)", () => Promise.resolve(null)],
			["() => None", () => none],
			["() => Promise.resolve(None)", () => Promise.resolve(none)],
			["() => throw", makeThrow],
			["() => Promise.reject(error)", () => Promise.reject(error)],
		])("GIVEN fromAsync(%s) THEN returns None", async (_, resolvable) => {
			const x = await fromAsync(resolvable);

			expect(x).toStrictEqual(none);
		});
	});

	describe("all", () => {
		test("GIVEN empty array THEN returns Option<[]>", () => {
			expect<Option<[]>>(Option.all([])).toEqual(some([]));
		});

		type Expected = Option<[number, boolean, bigint]>;

		test("GIVEN array of Some THEN returns Some", () => {
			const a: Option<number> = some(5);
			const b: Option<boolean> = some(true);
			const c: Option<bigint> = some(1n);

			expect<Expected>(Option.all([a, b, c])).toEqual(some([5, true, 1n]));
		});

		test("GIVEN array of Some with one None THEN returns None", () => {
			const a: Option<number> = some(5);
			const b: Option<boolean> = some(true);
			const c: Option<bigint> = none;

			expect<Expected>(Option.all([a, b, c])).toBe(none);
		});
	});

	describe("any", () => {
		test("GIVEN empty array THEN returns Option<never>", () => {
			const result = Option.any([]);

			expectTypeOf(result).toExtend<Option<never>>();
			expect<AnyOption>(result).toBe(none);
		});

		type Expected = Option<number | boolean | bigint>;

		test("GIVEN array with at least one Some THEN returns first Some", () => {
			const a: Option<number> = some(5);
			const b: Option<boolean> = some(true);
			const c: Option<bigint> = none;

			expect<Expected>(Option.any([a, b, c])).toBe(a);
		});

		test("GIVEN array of None THEN returns None", () => {
			const a: Option<number> = none;
			const b: Option<boolean> = none;
			const c: Option<bigint> = none;

			expect<Expected>(Option.any([a, b, c])).toBe(none);
		});
	});

	describe("@@toStringTag", () => {
		test("GIVEN Some THEN returns the Some tag", () => {
			expect<string>(some(1)[Symbol.toStringTag]).toBe("Some");
		});

		test("GIVEN None THEN returns the None tag", () => {
			expect<string>(none[Symbol.toStringTag]).toBe("None");
		});
	});

	describe("types", () => {
		test("GIVEN Some<T> THEN assigns to Option<T>", () => {
			expect<Option<string>>(some("foo"));
		});

		test("GIVEN None THEN assigns to Option<T>", () => {
			expect<Option<string>>(none);
		});
	});
});

/**
 * Runs `callback`, asserting it throws an {@link OptionError} carrying the given message.
 */
function expectOptionError(message: string, callback: () => unknown) {
	try {
		callback();

		throw new Error("callback should have thrown");
	} catch (raw) {
		const thrown = raw as OptionError;

		expect(thrown).toBeInstanceOf(OptionError);
		expect<string>(thrown.name).toBe("OptionError");
		expect<string>(thrown.message).toBe(message);
	}
}
