import { describe, expect, expectTypeOf, mock, test } from "bun:test";
import type { AnyResult, Err, None, Ok, Some } from "@types";
import {
	err,
	none,
	ok,
	Option,
	Result,
	ResultError,
	some,
} from "@utilities/result/index.ts";
import { error, makeThrow } from "./shared.ts";

describe("Result", () => {
	describe("prototype", () => {
		describe("isOk", () => {
			test("GIVEN ok THEN always returns true", () => {
				const x = ok(42);
				expect<boolean>(x.isOk()).toBe(true);
			});

			test("GIVEN err THEN always returns false", () => {
				const x = err("Some error message");
				expect<boolean>(x.isOk()).toBe(false);
			});
		});

		describe("isOkAnd", () => {
			test("GIVEN ok AND true-returning callback THEN returns true", () => {
				const x = ok(2);
				const callback = mock((value: number) => value > 1);

				expect(x.isOkAnd(callback)).toBe(true);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN ok AND false-returning callback THEN returns false", () => {
				const x = ok(0);
				const callback = mock((value: number) => value > 1);

				expect(x.isOkAnd(callback)).toBe(false);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(0);
				expect(callback).toHaveLastReturnedWith(false);
			});

			test("GIVEN err THEN always returns false", () => {
				const x = err("Some error message");
				const callback = mock((value: number) => value > 1);

				expect<boolean>(x.isOkAnd(callback)).toBe(false);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("isErr", () => {
			test("GIVEN ok THEN returns false", () => {
				const x = ok(42);
				expect<boolean>(x.isErr()).toBe(false);
			});

			test("GIVEN err THEN returns true", () => {
				const x = err("Some error message");
				expect<boolean>(x.isErr()).toBe(true);
			});
		});

		describe("isErrAnd", () => {
			test("GIVEN ok AND true-returning callback THEN returns true", () => {
				const x = ok(2);
				const callback = mock((value: Error) => value instanceof TypeError);

				expect(x.isErrAnd(callback)).toBe(false);
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN err AND false-returning callback THEN returns false", () => {
				const thrown = new Error("Some error message");
				const x = err(thrown);
				const callback = mock((value: Error) => value instanceof TypeError);

				expect(x.isErrAnd(callback)).toBe(false);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(thrown);
				expect(callback).toHaveLastReturnedWith(false);
			});

			test("GIVEN err AND true-returning callback THEN returns false", () => {
				const thrown = new TypeError("Some error message");
				const x = err(thrown);
				const callback = mock((value: Error) => value instanceof TypeError);

				expect(x.isErrAnd(callback)).toBe(true);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(thrown);
				expect(callback).toHaveLastReturnedWith(true);
			});
		});

		describe("ok", () => {
			test("GIVEN ok THEN returns some", () => {
				const x = ok(2);

				expect<Some<number>>(x.ok()).toEqual(some(2));
			});

			test("GIVEN err THEN returns none", () => {
				const x = err("Some error message");

				expect<None>(x.ok()).toEqual(none);
			});
		});

		describe("err", () => {
			test("GIVEN ok THEN returns none", () => {
				const x = ok(2);

				expect<None>(x.err()).toEqual(none);
			});

			test("GIVEN err THEN returns some", () => {
				const x = err("Some error message");

				expect<Some<string>>(x.err()).toEqual(
					Option.some("Some error message"),
				);
			});
		});

		describe("map", () => {
			test("GIVEN ok THEN returns ok with mapped value", () => {
				const x = ok(2);
				const callback = mock((value: number) => value > 1);

				expect<Ok<boolean>>(x.map(callback)).toEqual(ok(true));
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN err THEN returns err", () => {
				const x = err("Some error message");
				const callback = mock((value: number) => value > 1);

				expect(x.map(callback)).toEqual(err("Some error message"));
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN ok THEN chain map and mapErr THEN returns Ok<number, string>", () => {
				const x = Result.from<number, Error>(2);
				const callback = mock((value: number) => value);
				const mapChain = x.map(callback).mapErr((mapped) => mapped.message);

				expectTypeOf(mapChain).toExtend<Result<number, string>>();
				expect<Result<number, string>>(mapChain).toEqual(ok(2));
			});
		});

		describe("mapInto", () => {
			test("GIVEN ok THEN returns mapped result", () => {
				const x = ok(2);
				const callback = mock((value: number) => ok(value > 1));

				expect<Ok<boolean>>(x.mapInto(callback)).toEqual(ok(true));
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(ok(true));
			});

			test("GIVEN err THEN returns itself", () => {
				const x = err("Some error message");
				const callback = mock((value: number) => ok(value > 1));

				expect(x.mapInto(callback)).toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN ok THEN chain mapInto and map THEN returns Ok<number, string>", () => {
				const x = Result.from<number, string>(2);
				const callback = mock((value: number) => ok(value));
				const mapChain = x.mapInto(callback).map((value) => value + 1);

				expectTypeOf(mapChain).toExtend<Result<number, string>>();
				expect<Result<number, string>>(mapChain).toEqual(ok(3));
			});
		});

		describe("mapOr", () => {
			test("GIVEN ok THEN returns ok with mapped value", () => {
				const x = ok(2);
				const callback = mock((value: number) => value > 1);

				expect<boolean>(x.mapOr(false, callback)).toEqual(true);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN err THEN returns err", () => {
				const x = err("Some error message");
				const callback = mock((value: number) => value > 1);

				expect<boolean>(x.mapOr(false, callback)).toEqual(false);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("mapOrElse", () => {
			test("GIVEN ok THEN returns ok with mapped value", () => {
				const x = ok(2);
				const onErr = mock(() => false);
				const callback = mock((value: number) => value > 1);

				expect<boolean>(x.mapOrElse(onErr, callback)).toEqual(true);
				expect(onErr).not.toHaveBeenCalled();
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(callback).toHaveLastReturnedWith(true);
			});

			test("GIVEN err THEN returns err", () => {
				const x = err("Some error message");
				const onErr = mock(() => false);
				const callback = mock((value: number) => value > 1);

				expect<boolean>(x.mapOrElse(onErr, callback)).toEqual(false);
				expect(onErr).toHaveBeenCalledTimes(1);
				expect(onErr).toHaveBeenCalledWith("Some error message");
				expect(onErr).toHaveLastReturnedWith(false);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("mapErr", () => {
			test("GIVEN ok THEN returns ok", () => {
				const x = ok(2);
				const callback = mock((value: string) => value.length);

				expect<Result<number, number>>(x.mapErr(callback)).toEqual(ok(2));
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN err THEN returns err with mapped value", () => {
				const x = err("Some error message");
				const callback = mock((value: string) => value.length);

				expect<Result<number, number>>(x.mapErr(callback)).toEqual(err(18));
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith("Some error message");
				expect(callback).toHaveLastReturnedWith(18);
			});

			test("GIVEN ok THEN chain mapErr and map THEN returns Ok<number, string>", () => {
				const x = Result.from<number, string>(42);
				const callback = mock((value: string) => value);
				const mapChain = x.mapErr(callback).map((value) => value + 1);

				expectTypeOf(mapChain).toExtend<Result<number, string>>();
				expect<Result<number, string>>(mapChain).toEqual(ok(43));
			});
		});

		describe("mapErrInto", () => {
			test("GIVEN ok THEN returns itself", () => {
				const x = ok(2);
				const callback = mock((value: string) => ok(value.length));

				expect<Result<number, number>>(x.mapErrInto(callback)).toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN err THEN returns mapped result", () => {
				const x = err("Some error message");
				const callback = mock((value: string) => ok(value.length));

				expect<Result<number, number>>(x.mapErrInto(callback)).toEqual(ok(18));
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith("Some error message");
				expect(callback).toHaveLastReturnedWith(ok(18));
			});
		});

		describe("inspect", () => {
			test("GIVEN ok THEN calls callback and returns self", () => {
				const x = ok(2);
				const callback = mock();

				expect<typeof x>(x.inspect(callback)).toBe(x);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
			});

			test("GIVEN err THEN returns self", () => {
				const x = err("Some error message");
				const callback = mock();

				expect<typeof x>(x.inspect(callback)).toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("inspectAsync", () => {
			test("GIVEN ok THEN calls callback and returns self", async () => {
				const x = ok(2);
				let finished = false;
				const callback = mock(() => Bun.sleep(5).then(() => (finished = true)));

				await expect<Promise<typeof x>>(x.inspectAsync(callback)).resolves.toBe(
					x,
				);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith(2);
				expect(finished).toBe(true);
			});

			test("GIVEN err THEN returns self", async () => {
				const x = err("Some error message");
				const callback = mock();

				await expect<Promise<typeof x>>(x.inspectAsync(callback)).resolves.toBe(
					x,
				);
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("inspectErr", () => {
			test("GIVEN ok THEN calls callback and returns self", () => {
				const x = ok(2);
				const callback = mock();

				expect<typeof x>(x.inspectErr(callback)).toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN err THEN returns self", () => {
				const x = err("Some error message");
				const callback = mock();

				expect<typeof x>(x.inspectErr(callback)).toBe(x);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith("Some error message");
			});
		});

		describe("inspectErrAsync", () => {
			test("GIVEN ok THEN calls callback and returns self", async () => {
				const x = ok(2);
				const callback = mock();

				await expect<Promise<typeof x>>(
					x.inspectErrAsync(callback),
				).resolves.toBe(x);
				expect(callback).not.toHaveBeenCalled();
			});

			test("GIVEN err THEN returns self", async () => {
				const x = err("Some error message");
				let finished = false;
				const callback = mock(() => Bun.sleep(5).then(() => (finished = true)));

				await expect<Promise<typeof x>>(
					x.inspectErrAsync(callback),
				).resolves.toBe(x);
				expect(callback).toHaveBeenCalledTimes(1);
				expect(callback).toHaveBeenCalledWith("Some error message");
				expect(finished).toBe(true);
			});
		});

		describe("iter", () => {
			test("GIVEN ok THEN yields one value", () => {
				const x = ok(2);

				expect<number[]>([...x.iter()]).toStrictEqual([2]);
			});

			test("GIVEN err THEN yields no values", () => {
				const x = err("Some error message");

				expect<number[]>([...x.iter()]).toStrictEqual([]);
			});
		});

		describe("expect", () => {
			test("GIVEN ok THEN returns value", () => {
				const x = ok(2);

				expect<number>(x.expect("Whoops!")).toBe(2);
			});

			test("GIVEN err THEN throws ResultError", () => {
				const x = err("Some error message");

				expectResultError("Whoops!", "Some error message", () =>
					x.expect("Whoops!"),
				);
			});
		});

		describe("expectErr", () => {
			test("GIVEN ok THEN throws ResultError", () => {
				const x = ok(2);

				expectResultError("Whoops!", 2, () => x.expectErr("Whoops!"));
			});

			test("GIVEN err THEN returns error", () => {
				const x = err("Some error message");

				expect<string>(x.expectErr("Whoops!")).toBe("Some error message");
			});
		});

		describe("unwrap", () => {
			test("GIVEN ok THEN returns value", () => {
				const x = ok(2);

				expect<number>(x.unwrap()).toBe(2);
			});

			test("GIVEN err THEN throws ResultError", () => {
				const x = err("Some error message");

				expectResultError("Unwrap failed", "Some error message", () =>
					x.unwrap(),
				);
			});
		});

		describe("unwrapErr", () => {
			test("GIVEN ok THEN throws ResultError", () => {
				const x = ok(2);

				expectResultError("Unwrap failed", 2, () => x.unwrapErr());
			});

			test("GIVEN err THEN returns error", () => {
				const x = err("Some error message");

				expect<string>(x.unwrapErr()).toBe("Some error message");
			});
		});

		describe("unwrapOr", () => {
			test("GIVEN ok THEN returns value", () => {
				const x = ok(2);

				expect<number>(x.unwrapOr(5)).toBe(2);
			});

			test("GIVEN err THEN returns default", () => {
				const x = err("Some error message");

				expect<5>(x.unwrapOr(5)).toBe(5);
			});

			test("GIVEN Result<T, E> THEN returns union", () => {
				const x = ok(2) as Result<number, string>;

				expect<number | null>(x.unwrapOr(null)).toBe(2);
			});
		});

		describe("unwrapOrElse", () => {
			test("GIVEN ok THEN returns value", () => {
				const x = ok(2);

				expect<number>(x.unwrapOrElse(() => 5)).toBe(2);
			});

			test("GIVEN err THEN returns default", () => {
				const x = err("Some error message");

				expect<5>(x.unwrapOrElse(() => 5)).toBe(5);
			});

			test("GIVEN Result<T, E> THEN returns union", () => {
				const x = ok(2) as Result<number, string>;

				expect<number | null>(x.unwrapOrElse(() => null)).toBe(2);
			});
		});

		describe("unwrapRaw", () => {
			test("GIVEN ok THEN returns value", () => {
				const x = ok(2);

				expect<number>(x.unwrapRaw()).toBe(2);
			});

			test("GIVEN err THEN throws Error", () => {
				const thrown = new Error("Some error message");
				const x = err(thrown);

				expect(() => x.unwrapRaw()).toThrowError(thrown);
			});
		});

		describe("and", () => {
			test("GIVEN x=ok and y=ok THEN returns y", () => {
				const x = ok(2);
				const y = ok("Hello");

				expect<typeof y>(x.and(y)).toBe(y);
			});

			test("GIVEN x=ok and y=err THEN returns y", () => {
				const x = ok(2);
				const y = err("Late error");

				expect<typeof y>(x.and(y)).toBe(y);
			});

			test("GIVEN x=err and y=ok THEN returns x", () => {
				const x = err("Early error");
				const y = ok("Hello");

				expect<typeof x>(x.and(y)).toBe(x);
			});

			test("GIVEN x=err and y=err THEN returns x", () => {
				const x = err("Early error");
				const y = err("Late error");

				expect<typeof x>(x.and(y)).toBe(x);
			});
		});

		describe("andThen", () => {
			const divide = (value: number) =>
				value === 0 ? err("overflowed") : ok(4 / value);

			test("GIVEN ok AND ok-returning callback THEN returns ok", () => {
				const x = ok(4);
				const operation = mock(divide);

				expect<Result<number, string>>(x.andThen(operation)).toEqual(ok(1));
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(4);
				expect(operation).toHaveLastReturnedWith(ok(1));
			});

			test("GIVEN ok AND err-returning callback THEN returns err", () => {
				const x = ok(0);
				const operation = mock(divide);

				expect<Result<number, string>>(x.andThen(operation)).toEqual(
					err("overflowed"),
				);
				expect(operation).toHaveBeenCalledTimes(1);
				expect(operation).toHaveBeenCalledWith(0);
				expect(operation).toHaveLastReturnedWith(err("overflowed"));
			});

			test("GIVEN err THEN always returns err", () => {
				const x = err("not a number");
				const operation = mock(divide);

				expect(x.andThen(operation)).toBe(x);
				expect(operation).not.toHaveBeenCalled();
			});

			test("GIVEN ok THEN chain andThen and map THEN returns Ok<number, string>", () => {
				const x = Result.from<number, Error>(1);
				const callback = mock((value: number) => ok(`${value}`));
				const mapChain = x.andThen(callback).map((value) => Number(value));

				expectTypeOf(mapChain).toExtend<Result<number, string>>();
				expect<Result<number, string>>(mapChain).toEqual(ok(1));
			});
		});

		describe("or", () => {
			test("GIVEN x=ok and y=ok THEN returns x", () => {
				const x = ok(2);
				const y = ok(100);

				expect<typeof x>(x.or(y)).toBe(x);
			});

			test("GIVEN x=ok and y=err THEN returns x", () => {
				const x = ok(2);
				const y = err("Late error");

				expect<typeof x>(x.or(y)).toBe(x);
			});

			test("GIVEN x=err and y=ok THEN returns y", () => {
				const x = err("Early error");
				const y = ok(2);

				expect<typeof y>(x.or(y)).toBe(y);
			});

			test("GIVEN x=err and y=err THEN returns y", () => {
				const x = err("Early error");
				const y = err("Late error");

				expect<typeof y>(x.or(y)).toBe(y);
			});
		});

		describe("orElse", () => {
			const square = (value: number) => ok(value * value);
			const wrapErr = (value: number) => err(value);

			test("GIVEN x=ok, a->ok, b->ok THEN returns x without calling a or b", () => {
				const x = ok(2);
				const a = mock(square);
				const b = mock(square);

				expect<typeof x>(x.orElse(a).orElse(b)).toBe(x);
				expect(a).not.toHaveBeenCalled();
				expect(b).not.toHaveBeenCalled();
			});

			test("GIVEN x=ok, a->ok, b->err THEN returns x without calling a or b", () => {
				const x = ok(2);
				const a = mock(square);
				const b = mock(wrapErr);

				expect<typeof x>(x.orElse(a).orElse(b)).toBe(x);
				expect(a).not.toHaveBeenCalled();
				expect(b).not.toHaveBeenCalled();
			});

			test("GIVEN x=err, a->ok, b->err THEN returns ok without calling b", () => {
				const x = err(3);
				const a = mock(square);
				const b = mock(wrapErr);

				expect<Ok<number>>(x.orElse(a).orElse(b)).toEqual(ok(9));
				expect(a).toHaveBeenCalledTimes(1);
				expect(a).toHaveBeenCalledWith(3);
				expect(a).toHaveLastReturnedWith(ok(9));
				expect(b).not.toHaveBeenCalled();
			});

			test("GIVEN x=err, a->err, b->err THEN returns ok calling a and b", () => {
				const x = err(3);
				const a = mock(wrapErr);
				const b = mock(wrapErr);

				expect<Err<number>>(x.orElse(a).orElse(b)).toEqual(err(3));
				expect(a).toHaveBeenCalledTimes(1);
				expect(a).toHaveBeenCalledWith(3);
				expect(a).toHaveLastReturnedWith(err(3));
				expect(b).toHaveBeenCalledTimes(1);
				expect(b).toHaveBeenCalledWith(3);
				expect(b).toHaveLastReturnedWith(err(3));
			});
		});

		describe("contains", () => {
			test("GIVEN ok AND matching value THEN returns true", () => {
				const x = ok(2);

				expect<boolean>(x.contains(2)).toBe(true);
			});

			test("GIVEN ok AND different value THEN returns false", () => {
				const x = ok(3);

				expect<boolean>(x.contains(2)).toBe(false);
			});

			test("GIVEN err THEN always returns false", () => {
				const x = err("Some error message");

				expect<false>(x.contains(2)).toBe(false);
			});
		});

		describe("containsErr", () => {
			test("GIVEN ok THEN always returns false", () => {
				const x = ok(2);

				expect<false>(x.containsErr("Some error message")).toBe(false);
			});

			test("GIVEN err AND matching value THEN returns true", () => {
				const x = err("Some error message");

				expect<boolean>(x.containsErr("Some error message")).toBe(true);
			});

			test("GIVEN err AND different value THEN returns false", () => {
				const x = err("Some other error message");

				expect<boolean>(x.containsErr("Some error message")).toBe(false);
			});
		});

		describe("transpose", () => {
			test("GIVEN Ok<Some<T>> THEN returns Some<Ok<T>>", () => {
				const x = ok(some(5));

				expect(x.transpose()).toEqual(some(ok(5)));
			});

			test("GIVEN Ok<None> THEN returns None", () => {
				const x = ok(none);

				expect(x.transpose()).toEqual(none);
			});

			test("GIVEN Err<E> THEN returns Some<Err<E>>", () => {
				const x = err("Some error message");

				expect(x.transpose()).toEqual(some(err("Some error message")));
			});
		});

		describe("flatten", () => {
			test("GIVEN Ok<Ok<T>> THEN returns Ok<T>", () => {
				const x = ok(ok("Hello"));

				expect<Ok<string>>(x.flatten()).toEqual(ok("Hello"));
			});

			test("GIVEN Ok<Err<E>> THEN returns Err<E>", () => {
				const x = ok(err(6));

				expect<Err<number>>(x.flatten()).toEqual(err(6));
			});

			test("GIVEN Err<E> THEN returns Err<E>", () => {
				const x = err(6);

				expect<typeof x>(x.flatten()).toBe(x);
			});
		});

		describe("intoOkOrErr", () => {
			test("GIVEN ok(s) THEN returns s", () => {
				const x = ok(3);

				expect<number>(x.intoOkOrErr()).toBe(3);
			});

			test("GIVEN err(e) THEN returns e", () => {
				const x = err(4);

				expect<number>(x.intoOkOrErr()).toBe(4);
			});
		});

		describe("intoPromise", () => {
			test("GIVEN ok(Promise(s)) THEN returns Promise(ok(s))", async () => {
				const x = ok(Promise.resolve(3));

				await expect<Promise<Ok<number>>>(x.intoPromise()).resolves.toEqual(
					ok(3),
				);
			});

			test("GIVEN err(Promise(e)) THEN returns Promise(err(e))", async () => {
				const x = err(Promise.resolve(3));

				await expect<Promise<Err<number>>>(x.intoPromise()).resolves.toEqual(
					err(3),
				);
			});
		});

		describe("eq", () => {
			test("GIVEN x=ok(s), y=ok(s) THEN returns true", () => {
				const x = ok(3);
				const y = ok(3);

				expect<boolean>(x.eq(y)).toBe(true);
			});

			test("GIVEN x=ok(s), y=ok(t) / s !== t THEN returns false", () => {
				const x = ok(3);
				const y = ok(4);

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=ok(s), y=err(e) THEN always returns false", () => {
				const x = ok(3);
				const y = err(3);

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=err(e), y=ok(t) THEN always returns false", () => {
				const x = err(3);
				const y = ok(3);

				expect<boolean>(x.eq(y)).toBe(false);
			});

			test("GIVEN x=err(e), y=err(e) THEN returns true", () => {
				const x = err(3);
				const y = err(3);

				expect<boolean>(x.eq(y)).toBe(true);
			});

			test("GIVEN x=err(e), y=err(t) / e !== t THEN returns false", () => {
				const x = ok(3);
				const y = ok(4);

				expect<boolean>(x.eq(y)).toBe(false);
			});
		});

		describe("ne", () => {
			test("GIVEN x=ok(s), y=ok(s) THEN returns false", () => {
				const x = ok(3);
				const y = ok(3);

				expect<boolean>(x.ne(y)).toBe(false);
			});

			test("GIVEN x=ok(s), y=ok(t) / s !== t THEN returns true", () => {
				const x = ok(3);
				const y = ok(4);

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=ok(s), y=err(e) THEN always returns true", () => {
				const x = ok(3);
				const y = err(3);

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=err(e), y=ok(t) THEN always returns true", () => {
				const x = err(3);
				const y = ok(3);

				expect<boolean>(x.ne(y)).toBe(true);
			});

			test("GIVEN x=err(e), y=err(e) THEN returns false", () => {
				const x = err(3);
				const y = err(3);

				expect<boolean>(x.ne(y)).toBe(false);
			});

			test("GIVEN x=err(e), y=err(t) / e !== t THEN returns true", () => {
				const x = ok(3);
				const y = ok(4);

				expect<boolean>(x.ne(y)).toBe(true);
			});
		});

		describe("match", () => {
			test("GIVEN ok THEN calls ok callback", () => {
				const x = Result.ok(2);
				const onOk = mock((value: number) => value * 2);
				const onErr = mock((value: string) => value.length);

				expect<number>(x.match({ ok: onOk, err: onErr })).toBe(4);
				expect(onOk).toHaveBeenCalledTimes(1);
				expect(onOk).toHaveBeenCalledWith(2);
				expect(onOk).toHaveLastReturnedWith(4);
				expect(onErr).not.toHaveBeenCalled();
			});

			test("GIVEN err THEN calls err callback", () => {
				const x = Result.err("Some error message");
				const onOk = mock((value: number) => value * 2);
				const onErr = mock((value: string) => value.length);

				expect<number>(x.match({ ok: onOk, err: onErr })).toBe(18);
				expect(onOk).not.toHaveBeenCalled();
				expect(onErr).toHaveBeenCalledTimes(1);
				expect(onErr).toHaveBeenCalledWith("Some error message");
				expect(onErr).toHaveLastReturnedWith(18);
			});
		});
	});

	describe("ok", () => {
		test("GIVEN ok without an argument THEN returns Ok<undefined>", () => {
			const x = ok();

			expectTypeOf(x).toExtend<Ok<undefined>>();
			expectTypeOf(x).toExtend<Result<undefined, Error>>();
			expect<boolean>(x.isOk()).toBe(true);
			expect<boolean>(x.isErr()).toBe(false);
		});

		test("GIVEN ok with an argument THEN returns Ok<T>", () => {
			const x = ok(42);

			expectTypeOf(x).toExtend<Ok<number>>();
			expectTypeOf(x).toExtend<Result<number, Error>>();
			expect<boolean>(x.isOk()).toBe(true);
			expect<boolean>(x.isErr()).toBe(false);
		});
	});

	describe("err", () => {
		test("GIVEN err without an argument THEN returns Err<undefined>", () => {
			const x = err();

			expectTypeOf(x).toExtend<Err<undefined>>();
			expectTypeOf(x).toExtend<Result<number, undefined>>();
			expect<boolean>(x.isOk()).toBe(false);
			expect<boolean>(x.isErr()).toBe(true);
		});

		test("GIVEN err with an argument THEN returns Err<T>", () => {
			const x = err(new Error());

			expectTypeOf(x).toExtend<Err<Error>>();
			expectTypeOf(x).toExtend<Result<number, Error>>();
			expect<boolean>(x.isOk()).toBe(false);
			expect<boolean>(x.isErr()).toBe(true);
		});
	});

	describe("from", () => {
		const { from } = Result;

		test.each<
			[string, number | Ok<number> | (() => number) | (() => Ok<number>)]
		>([
			["T", 42],
			["Ok(T)", ok(42)],
			["() => T", () => 42],
			["() => Ok(T)", () => ok(42)],
		])("GIVEN from(%s) THEN returns Ok(T)", (_, resolvable) => {
			const x = from(resolvable);

			expect(x).toStrictEqual(ok(42));
		});

		test.each<[string, Err<Error> | (() => Err<Error>) | (() => never)]>([
			["Err(E)", err(error)],
			["() => Err(E)", () => err(error)],
			["() => throw E", makeThrow],
		])("GIVEN from(%s) THEN returns Err(E)", (_, resolvable) => {
			const x = from(resolvable);

			expect(x).toStrictEqual(err(error));
		});
	});

	describe("fromAsync", () => {
		const { fromAsync } = Result;

		test.each<[string, unknown]>([
			["T", 42],
			["Promise.resolve(T)", Promise.resolve(42)],
			["Ok(T)", ok(42)],
			["Promise.resolve(Ok(T))", Promise.resolve(ok(42))],
			["() => T", () => 42],
			["() => Promise.resolve(T)", () => Promise.resolve(42)],
			["() => Ok(T)", () => ok(42)],
			["() => Promise.resolve(Ok(T))", () => Promise.resolve(ok(42))],
		])("GIVEN fromAsync(%s) THEN returns Ok(T)", async (_, resolvable) => {
			const x = await fromAsync(resolvable as number);

			expect(x).toStrictEqual(ok(42));
		});

		test.each<[string, unknown]>([
			["Err(E)", err(error)],
			["() => throw E", makeThrow],
			["() => Promise.reject(E)", () => Promise.reject(error)],
			["() => Err(E)", () => err(error)],
			["() => Promise.reject(Err(E))", () => Promise.reject(err(error))],
		])("GIVEN fromAsync(%s) THEN returns Err(E)", async (label, resolvable) => {
			let x = await fromAsync<never, Error>(resolvable as never);

			if (label === "() => Promise.reject(Err(E))") {
				// This case double-nests the error, so it has to be unwrapped once more.
				x = x.unwrapErr() as unknown as Result<never, Error>;
			}

			expect(x).toEqual(err(error));
		});
	});

	describe("safeTry", () => {
		test("GIVEN a successful result THEN return Ok", () => {
			// biome-ignore lint/correctness/useYield: safeTry accepts generators that return without yielding
			const result = Result.safeTry(function* () {
				return ok(42);
			});

			expect(result).toEqual(ok(42));
		});

		test("GIVEN a async successful result THEN return Ok", async () => {
			const result = await Result.safeTry(async function* () {
				return Result.fromAsync(() => Promise.resolve(42));
			});

			expect(result).toEqual(ok(42));
		});

		test("GIVEN a unsuccessful result THEN return Err", () => {
			// biome-ignore lint/correctness/useYield: safeTry accepts generators that return without yielding
			const result = Result.safeTry(function* () {
				return err("Error!");
			});

			expect(result).toEqual(err("Error!"));
		});

		test("GIVEN a async unsuccessful result THEN return Err", async () => {
			const result = await Result.safeTry(async function* () {
				return Result.fromAsync(() => Promise.reject(new Error("Error!")));
			});

			expect(result).toEqual(err(new Error("Error!")));
		});

		test("GIVEN a mixed successful results THEN should return the last OK", () => {
			const result = Result.safeTry(function* ({ $ }) {
				const first = yield* ok(1)[$];
				const second = yield* ok(2)[$];
				return ok(first + second);
			});

			expect(result).toEqual(ok(3));
		});

		test("GIVEN a mixed async successful results THEN should return the last OK", async () => {
			const result = await Result.safeTry(async function* ({ $, $async }) {
				const first = yield* ok(1)[$];
				const second = yield* $async(
					Result.fromAsync(() => Promise.resolve(2)),
				);
				return ok(first + second);
			});

			expect(result).toEqual(ok(3));
		});

		test("GIVEN a mixed results THEN should stop and return first Err", () => {
			const values: number[] = [];

			const result = Result.safeTry(function* ({ $ }) {
				const first = yield* ok(1)[$];
				values.push(first);

				const second = yield* ok(2)[$];
				values.push(second);

				yield* err("Error!")[$];
				const third = yield* ok(3)[$];

				return ok(first + second + third);
			});

			expect(result).toEqual(err("Error!"));
			expect(values).toEqual([1, 2]);
		});

		test("GIVEN a mixed async results THEN should stop and return first Err", async () => {
			const values: number[] = [];

			const result = await Result.safeTry(async function* ({ $, $async }) {
				const first = yield* ok(1)[$];
				values.push(first);

				const second = yield* $async(
					Result.fromAsync(() => Promise.resolve(2)),
				);
				values.push(second);

				yield* err("Error!")[$];
				const third = yield* ok(3)[$];

				return ok(first + second + third);
			});

			expect(result).toEqual(err("Error!"));
			expect(values).toEqual([1, 2]);
		});
	});

	describe("all", () => {
		test("GIVEN empty array THEN returns Result<[], never>", () => {
			expect<Result<[], never>>(Result.all([])).toEqual(ok([]));
		});

		type Expected = Result<[number, boolean, bigint], string>;

		test("GIVEN array of Ok THEN returns Ok", () => {
			const a: Result<number, string> = ok(5);
			const b: Result<boolean, string> = ok(true);
			const c: Result<bigint, string> = ok(1n);

			expect<Expected>(Result.all([a, b, c])).toEqual(ok([5, true, 1n]));
		});

		test("GIVEN array of Ok with one Err THEN returns Err", () => {
			const a: Result<number, string> = ok(5);
			const b: Result<boolean, string> = ok(true);
			const c: Result<bigint, string> = err("Error!");

			const result = Result.all([a, b, c]);

			expectTypeOf(result).toExtend<Expected>();
			expect<AnyResult>(result).toBe(c);
		});
	});

	describe("any", () => {
		test("GIVEN empty array THEN returns Result<never, []>", () => {
			expect<Result<never, []>>(Result.any([])).toEqual(err([]));
		});

		type Expected = Result<number | boolean | bigint, [string, string, string]>;

		test("GIVEN array with at least one Ok THEN returns first Ok", () => {
			const a: Result<number, string> = ok(5);
			const b: Result<boolean, string> = ok(true);
			const c: Result<bigint, string> = err("Error!");

			const result = Result.any([a, b, c]);

			expectTypeOf(result).toExtend<Expected>();
			expect<AnyResult>(result).toBe(a);
		});

		test("GIVEN array of Ok with one Err THEN returns Err", () => {
			const a: Result<number, string> = err("Not a number!");
			const b: Result<boolean, string> = err("Not a boolean!");
			const c: Result<bigint, string> = err("Error!");

			expect<Expected>(Result.any([a, b, c])).toEqual(
				err(["Not a number!", "Not a boolean!", "Error!"]),
			);
		});
	});

	describe("@@toStringTag", () => {
		test("GIVEN Ok THEN returns the Ok tag", () => {
			expect<string>(ok(1)[Symbol.toStringTag]).toBe("Ok");
		});

		test("GIVEN Err THEN returns the Err tag", () => {
			expect<string>(err(1)[Symbol.toStringTag]).toBe("Err");
		});
	});

	describe("types", () => {
		test("GIVEN Ok<T> THEN assigns to Result<T, E>", () => {
			expect<Result<number, string>>(ok(4));
		});

		test("GIVEN Err<E> THEN assigns to Result<T, E>", () => {
			expect<Result<number, string>>(err("foo"));
		});
	});
});

/**
 * Runs `callback`, asserting it throws a {@link ResultError} carrying the given message and value.
 */
function expectResultError<E>(
	message: string,
	value: E,
	callback: () => unknown,
) {
	try {
		callback();

		throw new Error("callback should have thrown");
	} catch (raw) {
		const thrown = raw as ResultError<E>;

		expect(thrown).toBeInstanceOf(ResultError);
		expect<string>(thrown.name).toBe("ResultError");
		expect<string>(thrown.message).toBe(message);
		expect<E>(thrown.value).toBe(value);
	}
}
