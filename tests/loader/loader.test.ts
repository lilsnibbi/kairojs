import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { AliasPiece } from "@/loader/aliasPiece.ts";
import { AliasStore } from "@/loader/aliasStore.ts";
import { VirtualPath } from "@/loader/constants.ts";
import { LoaderError } from "@/loader/errors.ts";
import { Piece } from "@/loader/piece.ts";
import { getRootData } from "@/loader/root.ts";
import { Store } from "@/loader/store.ts";

const root = resolve(import.meta.dir, "..", "fixtures", "bot");

const store = new Store(Piece as never, {
	name: "greetings" as never,
	paths: [resolve(root, "greetings")],
});
await store.loadAll();

const nested = new Store(Piece as never, {
	name: "nested" as never,
	paths: [resolve(root, "nested")],
});
await nested.loadAll();

const absent = new Store(Piece as never, {
	name: "absent" as never,
	paths: [resolve(root, "does-not-exist")],
});
await absent.loadAll();

describe("Store discovery", () => {
	test("GIVEN a directory THEN discovers pieces, skipping _-prefixed files and .d.ts", () => {
		expect([...store.keys()].sort()).toEqual(["hello", "multi"]);
	});

	// Every class a module exports is named after the MODULE, so the two classes in `multi.ts` both
	// claim the name "multi" and the later one replaces the earlier — the last export wins.
	test("GIVEN a module exporting two pieces THEN it collapses to the module name, last export winning", () => {
		expect(store.get("multi")!.constructor.name).toBe("BetaPiece");
	});

	test("GIVEN nested directories THEN walks them recursively", () => {
		expect([...nested.keys()]).toEqual(["buried"]);
	});

	test("GIVEN a missing directory THEN loads empty rather than throwing", () => {
		expect(absent.size).toBe(0);
	});
});

describe("Piece location metadata", () => {
	test("GIVEN a piece on disk THEN location.relative uses forward slashes", () => {
		expect(store.get("hello")!.location.relative).toBe("hello.ts");
	});

	test("GIVEN a piece on disk THEN location.name is the file name", () => {
		expect(store.get("hello")!.location.name).toBe("hello.ts");
	});

	test("GIVEN a piece on disk THEN location.virtual is false", () => {
		expect(store.get("hello")!.location.virtual).toBe(false);
	});

	test("GIVEN a nested piece THEN location.directories lists the intermediate folders", () => {
		expect(nested.get("buried")!.location.directories).toEqual(["deep"]);
	});
});

describe("Reload and unload", () => {
	test("GIVEN an edited file THEN reload picks up the change and replaces the instance", async () => {
		const hello = store.get("hello")!;
		const helloFile = resolve(root, "greetings", "hello.ts");
		const original = await Bun.file(helloFile).text();

		expect((hello as any).greet()).toBe("hello v1");

		await Bun.write(helloFile, original.replace("hello v1", "hello v2"));
		try {
			await hello.reload();

			expect((store.get("hello") as any).greet()).toBe("hello v2");
			expect(store.get("hello") === hello).toBe(false);
		} finally {
			await Bun.write(helloFile, original);
		}
	});

	test("GIVEN a loaded piece THEN unload removes it from the store", async () => {
		await store.get("hello")!.unload();
		expect(store.has("hello")).toBe(false);
	});
});

describe("onLoad", () => {
	test("GIVEN a piece that disables itself in onLoad THEN it is not stored", async () => {
		class SelfDisabling extends Piece {
			public override onLoad() {
				this.enabled = false;
				return undefined;
			}
		}

		const disabling = new Store(SelfDisabling as never, {
			name: "disabling" as never,
		});
		await disabling.loadPiece({ name: "nope", piece: SelfDisabling as never });
		await disabling.loadAll();

		expect(disabling.has("nope")).toBe(false);
	});
});

class Manual extends Piece {}

const manual = new Store(Piece as never, { name: "manual" as never });
await manual.loadPiece({ name: "manual-one", piece: Manual as never });
await manual.loadAll();

describe("Virtual pieces", () => {
	test("GIVEN a manually registered piece THEN it loads", () => {
		expect(manual.has("manual-one")).toBe(true);
	});

	test("GIVEN a manually registered piece THEN its location is virtual", () => {
		expect(manual.get("manual-one")!.location.virtual).toBe(true);
	});

	test("GIVEN a manually registered piece THEN its relative path is the virtual path sentinel", () => {
		expect(manual.get("manual-one")!.location.relative).toBe(VirtualPath);
	});

	test("GIVEN a second loadAll THEN manually registered pieces survive", async () => {
		await manual.loadAll();
		expect(manual.has("manual-one")).toBe(true);
	});

	test("GIVEN a virtual path THEN loading it from disk throws a LoaderError", async () => {
		let virtualError: unknown;
		try {
			await manual.load(VirtualPath, VirtualPath);
		} catch (error) {
			virtualError = error;
		}

		expect(virtualError instanceof LoaderError).toBe(true);
	});

	test("GIVEN a class that does not extend the store's constructor THEN registering it throws a LoaderError", async () => {
		let typeError: unknown;
		try {
			await manual.loadPiece({
				name: "bad",
				piece: class NotAPiece {} as never,
			});
		} catch (error) {
			typeError = error;
		}

		expect(typeError instanceof LoaderError).toBe(true);
	});
});

class Aliased extends AliasPiece {
	public constructor(context: never, options: never) {
		super(context, { ...(options as object), aliases: ["pong", "p"] } as never);
	}
}

const aliasStore = new AliasStore(AliasPiece as never, {
	name: "aliased" as never,
});
await aliasStore.loadPiece({ name: "ping", piece: Aliased as never });
await aliasStore.loadAll();

describe("AliasStore", () => {
	test("GIVEN an aliased piece THEN it resolves by its primary name", () => {
		expect(aliasStore.has("ping")).toBe(true);
	});

	test("GIVEN an aliased piece THEN it resolves by its alias", () => {
		expect(aliasStore.has("pong")).toBe(true);
	});

	test("GIVEN an aliased piece THEN getting it by alias returns the same instance", () => {
		expect(aliasStore.get("pong") === aliasStore.get("ping")).toBe(true);
	});

	test("GIVEN an unloaded piece THEN its aliases are cleared too", async () => {
		await aliasStore.unload("ping");
		expect(aliasStore.has("pong")).toBe(false);
	});
});

describe("Root data", () => {
	test("GIVEN the running process THEN getRootData resolves a directory", () => {
		const { root: rootDirectory } = getRootData();
		expect(typeof rootDirectory === "string" && rootDirectory.length > 0).toBe(
			true,
		);
	});
});
