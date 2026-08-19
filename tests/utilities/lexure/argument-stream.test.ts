import { describe, expect, mock, spyOn, test } from "bun:test";
import {
	ArgumentStream,
	Lexer,
	Parser,
	PrefixedStrategy,
	WordParameter,
} from "@utilities/lexure/index.ts";
import { Option, Result } from "@utilities/result/index.ts";
import type { ArgumentStreamState, Parameter } from "@types";

describe("ArgumentStream", () => {
	const parser = new Parser(new PrefixedStrategy(["--", "/"], ["=", ":"]));
	const lexer = new Lexer({
		quotes: [
			['"', '"'],
			["“", "”"],
			["「", "」"],
		],
	});

	describe("no parameters", () => {
		const results = parser.run(lexer.run(""));
		const stream = new ArgumentStream(results);

		test("GIVEN instance THEN yields initial state with correct values", () => {
			expect(stream.results).toBe(results);
			expect(stream.state).toStrictEqual({ used: new Set(), position: 0 });
			expect(stream.finished).toBe(true);
			expect(stream.length).toBe(0);
			expect(stream.remaining).toBe(0);
			expect(stream.used).toBe(0);
		});
	});

	describe("single", () => {
		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect<Option<string>>(stream.single()).toEqual(Option.none);
		});

		test("GIVEN one parameter THEN returns one", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1")));

			expect<Option<string>>(stream.single()).toEqual(Option.some("1"));
			expect<Option<string>>(stream.single()).toEqual(Option.none);
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1 2 3")));

			expect<Option<string>>(stream.single()).toEqual(Option.some("1"));
			expect<Option<string>>(stream.single()).toEqual(Option.some("2"));
			expect<Option<string>>(stream.single()).toEqual(Option.some("3"));
			expect<Option<string>>(stream.single()).toEqual(Option.none);
		});
	});

	describe("singleMap", () => {
		const parse = (value: string) => {
			const number = Number(value);
			return Number.isNaN(number) ? Option.none : Option.some(number);
		};
		type MapResult = Option<number>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.none);
		});

		test("GIVEN one parameter THEN returns one", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1")));

			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.some(1));
			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.none);
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1 2 3")));

			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.some(1));
			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.some(2));
			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.some(3));
			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.none);
		});

		test("GIVEN an invalid parameter THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			expect<MapResult>(stream.singleMap(parse)).toEqual(Option.none);
			expect(stream.state.position).toBe(0);
		});

		test("GIVEN an invalid parameter and useAnyways THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			expect<MapResult>(stream.singleMap(parse, true)).toEqual(Option.none);
			expect(stream.state.position).toBe(1);
		});
	});

	describe("singleMapAsync", () => {
		const parse = (value: string) => {
			const number = Number(value);
			return Promise.resolve(
				Number.isNaN(number) ? Option.none : Option.some(number),
			);
		};
		type MapResult = Promise<Option<number>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.none,
			);
		});

		test("GIVEN one parameter THEN returns one", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1")));

			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.some(1),
			);
			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.none,
			);
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1 2 3")));

			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.some(1),
			);
			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.some(2),
			);
			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.some(3),
			);
			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.none,
			);
		});

		test("GIVEN an invalid parameter THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			await expect<MapResult>(stream.singleMapAsync(parse)).resolves.toEqual(
				Option.none,
			);
			expect(stream.state.position).toBe(0);
		});

		test("GIVEN an invalid parameter and useAnyways THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			await expect<MapResult>(
				stream.singleMapAsync(parse, true),
			).resolves.toEqual(Option.none);
			expect(stream.state.position).toBe(1);
		});
	});

	describe("singleParse", () => {
		const parse = (value: string) => {
			const number = Number(value);
			return Number.isNaN(number)
				? Result.err(`Could not parse ${value} to a number`)
				: Result.ok(number);
		};
		type ParseResult = Result<number, string | null>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.err(null));
		});

		test("GIVEN one parameter THEN returns one", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1")));

			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.ok(1));
			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.err(null));
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1 2 3")));

			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.ok(1));
			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.ok(2));
			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.ok(3));
			expect<ParseResult>(stream.singleParse(parse)).toEqual(Result.err(null));
		});

		test("GIVEN an invalid parameter THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			expect<ParseResult>(stream.singleParse(parse)).toEqual(
				Result.err("Could not parse a to a number"),
			);
			expect(stream.state.position).toBe(0);
		});

		test("GIVEN an invalid parameter and useAnyways THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			expect<ParseResult>(stream.singleParse(parse, true)).toEqual(
				Result.err("Could not parse a to a number"),
			);
			expect(stream.state.position).toBe(1);
		});
	});

	describe("singleParseAsync", () => {
		const parse = (value: string) => {
			const number = Number(value);
			return Promise.resolve(
				Number.isNaN(number)
					? Result.err(`Could not parse ${value} to a number`)
					: Result.ok(number),
			);
		};
		type ParseResult = Promise<Result<number, string | null>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.err(null));
		});

		test("GIVEN one parameter THEN returns one", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1")));

			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.ok(1));
			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.err(null));
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("1 2 3")));

			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.ok(1));
			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.ok(2));
			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.ok(3));
			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.err(null));
		});

		test("GIVEN an invalid parameter THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			await expect<ParseResult>(
				stream.singleParseAsync(parse),
			).resolves.toEqual(Result.err("Could not parse a to a number"));
			expect(stream.state.position).toBe(0);
		});

		test("GIVEN an invalid parameter and useAnyways THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("a")));

			await expect<ParseResult>(
				stream.singleParseAsync(parse, true),
			).resolves.toEqual(Result.err("Could not parse a to a number"));
			expect(stream.state.position).toBe(1);
		});
	});

	describe("find", () => {
		const predicate = (value: string) => value.startsWith("a");
		type FindResult = Option<string>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			expect<FindResult>(stream.find(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			expect<FindResult>(stream.find(callback)).toEqual(Option.some("aa"));
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.find(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			expect<FindResult>(stream.find(callback)).toEqual(Option.some("aa"));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.find(callback)).toEqual(Option.some("ac"));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			expect<FindResult>(stream.find(callback)).toEqual(Option.none);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			expect<FindResult>(stream.find(callback)).toEqual(Option.none);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("findAsync", () => {
		const predicate = (value: string) => Promise.resolve(value.startsWith("a"));
		type FindResult = Promise<Option<string>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.some("aa"),
			);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.some("aa"),
			);
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.some("ac"),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("findMap", () => {
		const predicate = (value: string) =>
			value.startsWith("a") ? Option.some(value.repeat(2)) : Option.none;
		type FindResult = Option<string>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.some("aaaa"));
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.some("aaaa"));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.some("acac"));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.none);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findMap(callback)).toEqual(Option.none);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("findMapAsync", () => {
		const predicate = (value: string) =>
			Promise.resolve(
				value.startsWith("a") ? Option.some(value.repeat(2)) : Option.none,
			);
		type FindResult = Promise<Option<string>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.some("aaaa"),
			);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.some("aaaa"),
			);
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.some("acac"),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			await expect<FindResult>(stream.findMapAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("findParse", () => {
		const predicate = (value: string) => {
			const number = Number(value);
			return Number.isNaN(number)
				? Result.err(`Could not parse ${value} to a number`)
				: Result.ok(number);
		};
		type FindResult = Result<number, string[]>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findParse(callback)).toEqual(Result.err([]));
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("4")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findParse(callback)).toEqual(Result.ok(4));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.findParse(callback)).toEqual(Result.err([]));
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("4 a 2 b")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findParse(callback)).toEqual(Result.ok(4));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FindResult>(stream.findParse(callback)).toEqual(Result.ok(2));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			expect<FindResult>(stream.findParse(callback)).toEqual(
				Result.err([
					"Could not parse a to a number",
					"Could not parse b to a number",
				]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			expect<FindResult>(stream.findParse(callback)).toEqual(
				Result.err([
					"Could not parse ba to a number",
					"Could not parse bb to a number",
					"Could not parse ca to a number",
					"Could not parse dd to a number",
				]),
			);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("findParseAsync", () => {
		const predicate = (value: string) => {
			const number = Number(value);
			return Promise.resolve(
				Number.isNaN(number)
					? Result.err(`Could not parse ${value} to a number`)
					: Result.ok(number),
			);
		};
		type FindResult = Promise<Result<number, string[]>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(Result.err([]));
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("4")));
			const callback = mock(predicate);

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(Result.ok(4));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(Result.err([]));
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("4 a 2 b")));
			const callback = mock(predicate);

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(Result.ok(4));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(Result.ok(2));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
			callback.mockClear();

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(
				Result.err([
					"Could not parse a to a number",
					"Could not parse b to a number",
				]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			await expect<FindResult>(
				stream.findParseAsync(callback),
			).resolves.toEqual(
				Result.err([
					"Could not parse ba to a number",
					"Could not parse bb to a number",
					"Could not parse ca to a number",
					"Could not parse dd to a number",
				]),
			);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("many", () => {
		type ManyResult = Option<Parameter[]>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect<ManyResult>(stream.many()).toEqual(Option.none);
		});

		test("GIVEN one parameter THEN returns some", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("foo")));

			expect<ManyResult>(stream.many()).toEqual(
				Option.some([new WordParameter([], { value: "foo" })]),
			);
		});
	});

	describe("filter", () => {
		const predicate = (value: string) => value.startsWith("a");
		type FilterResult = Option<string[]>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filter(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filter(callback)).toEqual(
				Option.some(["aa"]),
			);
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FilterResult>(stream.filter(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filter(callback)).toEqual(
				Option.some(["aa", "ac"]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(4);
			callback.mockClear();

			expect<FilterResult>(stream.filter(callback)).toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filter(callback)).toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("filterAsync", () => {
		const predicate = (value: string) => Promise.resolve(value.startsWith("a"));
		type FilterResult = Promise<Option<string[]>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.some(["aa"]),
			);
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.none,
			);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.some(["aa", "ac"]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(4);
			callback.mockClear();

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.some([]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			await expect<FilterResult>(stream.filterAsync(callback)).resolves.toEqual(
				Option.some([]),
			);
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("filterMap", () => {
		const predicate = (value: string) =>
			value.startsWith("a") ? Option.some(value.repeat(2)) : Option.none;
		type FilterResult = Option<string[]>;

		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filterMap(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filterMap(callback)).toEqual(
				Option.some(["aaaa"]),
			);
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			expect<FilterResult>(stream.filterMap(callback)).toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filterMap(callback)).toEqual(
				Option.some(["aaaa", "acac"]),
			);
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(4);
			callback.mockClear();

			expect<FilterResult>(stream.filterMap(callback)).toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			expect<FilterResult>(stream.filterMap(callback)).toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("filterMapAsync", () => {
		const predicate = (value: string) =>
			Promise.resolve(
				value.startsWith("a") ? Option.some(value.repeat(2)) : Option.none,
			);
		type FilterResult = Promise<Option<string[]>>;

		test("GIVEN no parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const callback = mock(predicate);

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN one matching parameter THEN returns it", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa")));
			const callback = mock(predicate);

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.some(["aaaa"]));
			expect([...stream.state.used]).toStrictEqual([0]);
			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.none);
			expect(callback).not.toHaveBeenCalled();
		});

		test("GIVEN multiple parameters THEN returns each one in sequential order", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("aa bb ac dd")));
			const callback = mock(predicate);

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.some(["aaaa", "acac"]));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(4);
			callback.mockClear();

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([0, 2]);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		test("GIVEN invalid parameters THEN returns none", async () => {
			const stream = new ArgumentStream(parser.run(lexer.run("ba bb ca dd")));
			const callback = mock(predicate);

			await expect<FilterResult>(
				stream.filterMapAsync(callback),
			).resolves.toEqual(Option.some([]));
			expect([...stream.state.used]).toStrictEqual([]);
			expect(callback).toHaveBeenCalledTimes(4);
		});
	});

	describe("flag", () => {
		test("GIVEN no parameters THEN returns false", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect(stream.flag("a", "b")).toEqual(false);
		});

		test("GIVEN one matching flag parameter THEN returns true", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("--a")));

			expect(stream.flag("a", "b")).toEqual(true);
		});

		test("GIVEN multiple matching flag parameters THEN returns true", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("--a --b")));

			expect(stream.flag("a", "b")).toEqual(true);
		});

		test("GIVEN non-matching flags parameter THEN returns false", () => {
			const stream = new ArgumentStream(
				parser.run(lexer.run("--c --foo --bar")),
			);

			expect(stream.flag("a", "b")).toEqual(false);
		});
	});

	describe("option", () => {
		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect(stream.option("foo", "bar")).toEqual(Option.none);
		});

		test("GIVEN one matching option parameter THEN returns its value", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("--foo=1")));

			expect(stream.option("foo", "bar")).toEqual(Option.some("1"));
		});

		test("GIVEN multiple matching options parameter THEN returns the last value", () => {
			const stream = new ArgumentStream(
				parser.run(lexer.run("--foo=1 --foo=2 --bar=3")),
			);

			expect(stream.option("foo", "bar")).toEqual(Option.some("3"));
		});

		test("GIVEN non-matching options parameter THEN returns none", () => {
			const stream = new ArgumentStream(
				parser.run(lexer.run("--hello=1 --hello=2 --baz=3")),
			);

			expect(stream.option("foo", "bar")).toEqual(Option.none);
		});
	});

	describe("options", () => {
		test("GIVEN no parameters THEN returns none", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			expect(stream.options("foo", "bar")).toEqual(Option.none);
		});

		test("GIVEN one matching option parameter THEN returns its value", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("--foo=1")));

			expect(stream.options("foo", "bar")).toEqual(Option.some(["1"]));
		});

		test("GIVEN multiple matching options parameter THEN returns its values", () => {
			const stream = new ArgumentStream(
				parser.run(lexer.run("--foo=1 --foo=2 --bar=3")),
			);

			expect(stream.options("foo", "bar")).toEqual(
				Option.some(["1", "2", "3"]),
			);
		});

		test("GIVEN non-matching options parameter THEN returns none", () => {
			const stream = new ArgumentStream(
				parser.run(lexer.run("--hello=1 --hello=2 --baz=3")),
			);

			expect(stream.options("foo", "bar")).toEqual(Option.none);
		});
	});

	describe("save", () => {
		test("GIVEN an instance THEN returns a clone of the state", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const state = stream.save();

			// The returned state equals the current one:
			expect(state).toEqual(stream.state);

			// But is not equal to the current one:
			expect(Object.is(state, stream.state)).toBe(false);
			expect(Object.is(state.used, stream.state.used)).toBe(false);
		});
	});

	describe("restore", () => {
		test("GIVEN an instance THEN sets the given state", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));
			const state: ArgumentStreamState = { used: new Set(), position: 0 };

			stream.restore(state);
			expect(stream.state).toBe(state);
		});
	});

	describe("reset", () => {
		test("GIVEN an instance THEN sets a blank new state", () => {
			const stream = new ArgumentStream(parser.run(lexer.run("")));

			const restoreSpy = spyOn(stream, "restore");
			stream.reset();

			expect(restoreSpy).toHaveBeenCalledTimes(1);
			expect(restoreSpy).toHaveBeenLastCalledWith({
				used: new Set(),
				position: 0,
			});
		});
	});
});
