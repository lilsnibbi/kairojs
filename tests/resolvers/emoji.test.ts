import { describe, expect, test } from "bun:test";
import { Identifiers } from "@/constants/identifiers.ts";
import { resolveEmoji } from "@/resolvers/emoji.ts";
import { Result } from "@utilities/result/index.ts";

describe("Emoji resolver", () => {
	test("GIVEN a unicode emoji THEN returns an emoji object", () => {
		const resolvedEmoji = resolveEmoji("😄");
		expect(resolvedEmoji.isOk()).toBe(true);
		expect(() => resolvedEmoji.unwrapErr()).toThrow();
		expect(resolvedEmoji.unwrap()).toMatchObject({ id: null, name: "😄" });
	});

	test("GIVEN a shortcode emoji THEN returns ArgumentEmojiError", () => {
		expect(resolveEmoji(":smile:")).toEqual(
			Result.err(Identifiers.ArgumentEmojiError),
		);
	});

	test("GIVEN a plain string THEN returns ArgumentEmojiError", () => {
		expect(resolveEmoji("foo")).toEqual(
			Result.err(Identifiers.ArgumentEmojiError),
		);
	});

	test("GIVEN a wrongly formatted custom emoji THEN returns ArgumentEmojiError", () => {
		expect(resolveEmoji("<custom:737141877803057244>")).toEqual(
			Result.err(Identifiers.ArgumentEmojiError),
		);
	});

	test("GIVEN a custom emoji THEN returns an emoji object", () => {
		const resolvedEmoji = resolveEmoji("<:custom:737141877803057244>");
		expect(resolvedEmoji.isOk()).toBe(true);
		expect(() => resolvedEmoji.unwrapErr()).toThrow();
		expect(resolvedEmoji.unwrap()).toMatchObject({
			id: "737141877803057244",
			name: "custom",
		});
	});

	test("GIVEN an animated custom emoji THEN returns an emoji object", () => {
		const resolvedEmoji = resolveEmoji("<a:custom:737141877803057244>");
		expect(resolvedEmoji.isOk()).toBe(true);
		expect(() => resolvedEmoji.unwrapErr()).toThrow();
		expect(resolvedEmoji.unwrap()).toMatchObject({
			animated: true,
			id: "737141877803057244",
			name: "custom",
		});
	});
});
