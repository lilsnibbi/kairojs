import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	mock,
	test,
} from "bun:test";
import { URL as NodeUrl } from "node:url";
import {
	fetch,
	FetchMediaContentTypes,
	FetchMethods,
	FetchResultTypes,
} from "@utilities/fetch/index.ts";
import type { QueryError } from "@utilities/fetch/index.ts";

/**
 * The original suite booted an `msw` server. There is no `msw` here (and the suite must not touch
 * the network), so `globalThis.fetch` is replaced by a router that answers exactly the four routes
 * the original handlers served. Every request that does not match one of them throws, which keeps
 * the implicit "the request went to the right URL with the right method" assertion that `msw`'s
 * routing provided.
 */
function jsonResponse(data: unknown, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const requests: Request[] = [];

const fetchMock = mock(
	async (
		input: string | URL | Request,
		init?: RequestInit,
	): Promise<Response> => {
		// `bun-types` declares no `URL` overload for the `Request` constructor, and cannot resolve an
		// overload against a union either. Stringifying a non-`Request` input is what the constructor
		// itself does with a `URL` (and is the identity for a string), so the routing below is unchanged.
		const request =
			input instanceof Request
				? new Request(input, init)
				: new Request(input.toString(), init);
		requests.push(request);

		const { origin, pathname } = new URL(request.url);
		const route = `${request.method} ${origin}${pathname}`;

		switch (route) {
			case "GET http://localhost/simpleget":
				return jsonResponse({ test: true }, 200);

			case "POST http://localhost/simplepost": {
				const body = (await request.json()) as unknown;
				if (
					body &&
					typeof body === "object" &&
					(body as Record<string, unknown>).kairo === "isAwesome"
				) {
					return jsonResponse({ test: true }, 200);
				}

				return jsonResponse({ test: false }, 400);
			}

			case "GET http://localhost/404":
				return jsonResponse({ success: false }, 404);

			case "POST http://localhost/upload":
				try {
					await request.json();
					return jsonResponse(
						{
							message: "Successfully parsed body as JSON, this is unexpected!!",
						},
						200,
					);
				} catch {
					return jsonResponse(
						{ message: "Failed to parse body as JSON, this is expected!!" },
						200,
					);
				}

			default:
				throw new Error(`Unhandled request: ${route}`);
		}
	},
);

const realFetch = globalThis.fetch;

describe("fetch", () => {
	beforeAll(() => {
		globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
	});

	afterEach(() => {
		requests.length = 0;
		fetchMock.mockClear();
	});

	afterAll(() => {
		globalThis.fetch = realFetch;
	});

	describe("Successful fetches", () => {
		test("GIVEN fetch w/ JSON response THEN returns JSON", async () => {
			const response = await fetch<{ test: boolean }>(
				"http://localhost/simpleget",
				FetchResultTypes.JSON,
			);

			expect(response.test).toBe(true);
			expect(requests[0].method).toBe("GET");
			expect(requests[0].url).toBe("http://localhost/simpleget");
		});

		test("GIVEN fetch w/o options w/ JSON response THEN returns JSON", async () => {
			const response = await fetch<{ test: boolean }>(
				"http://localhost/simpleget",
			);

			expect(response.test).toBe(true);
		});

		test("GIVEN fetch w/ options AND explicit type w/ JSON response THEN returns JSON", async () => {
			const response = await fetch<{ test: boolean }>(
				"http://localhost/simpleget",
				{ headers: { accept: "application/json" } },
				FetchResultTypes.JSON,
			);

			expect(response.test).toBe(true);
			expect(requests[0].headers.get("accept")).toBe("application/json");
		});

		test("GIVEN fetch w/ options w/ No Response THEN returns JSON", async () => {
			const response = await fetch<{ test: boolean }>(
				"http://localhost/simpleget",
				{
					headers: { accept: "application/json" },
				},
			);

			expect(response.test).toBe(true);
		});

		test("GIVEN fetch w/ Result Response THEN returns Result", async () => {
			const response = await fetch(
				"http://localhost/simpleget",
				FetchResultTypes.Result,
			);

			expect(response.ok).toBe(true);
			expect(response.bodyUsed).toBe(false);
		});

		test("GIVEN fetch w/ Buffer Response THEN returns Buffer", async () => {
			const response = await fetch(
				"http://localhost/simpleget",
				FetchResultTypes.Buffer,
			);

			// `FetchResultTypes.Buffer` resolves to a `Uint8Array` here, where the original resolved
			// to a Node `Buffer`.
			expect(response).toStrictEqual(
				new TextEncoder().encode(JSON.stringify({ test: true })),
			);
		});

		test("GIVEN fetch w/ Blob Response THEN returns Blob", async () => {
			const response = await fetch(
				"http://localhost/simpleget",
				FetchResultTypes.Blob,
			);
			const jsonData = await response.text();

			expect(jsonData).toStrictEqual(JSON.stringify({ test: true }));
		});

		test("GIVEN fetch w/ Text Response THEN returns raw text", async () => {
			const response = await fetch(
				"http://localhost/simpleget",
				FetchResultTypes.Text,
			);

			expect(response).toStrictEqual(JSON.stringify({ test: true }));
		});

		test("GIVEN fetch w/ NodeJS URL class THEN returns result", async () => {
			const url = new NodeUrl("http://localhost/simpleget");
			const response = await fetch(url, FetchResultTypes.Text);

			expect(response).toStrictEqual(JSON.stringify({ test: true }));
		});

		test("GIVEN fetch w/ Browser URL class THEN returns result", async () => {
			const url = new URL("http://localhost/simpleget");
			const response = await fetch(url, FetchResultTypes.Text);

			expect(response).toStrictEqual(JSON.stringify({ test: true }));
		});

		test("GIVEN fetch w/ object body w/ JSON response THEN returns JSON", async () => {
			const response = await fetch<{ test: boolean }>(
				"http://localhost/simplepost",
				{ method: FetchMethods.Post, body: { kairo: "isAwesome" } },
				FetchResultTypes.JSON,
			);

			expect(response.test).toBe(true);
			expect(requests[0].method).toBe("POST");
		});

		test("GIVEN fetch w/ Blob body THEN returns successfully", async () => {
			const response = await fetch<{ message: string }>(
				"http://localhost/upload",
				{
					method: FetchMethods.Post,
					body: new Blob(["De Blob"], {
						type: FetchMediaContentTypes.TextPlain,
					}),
				},
				FetchResultTypes.JSON,
			);

			expect(response.message).toBe(
				"Failed to parse body as JSON, this is expected!!",
			);
		});

		test("GIVEN fetch w/ buffer body THEN returns successfully", async () => {
			const response = await fetch<{ message: string }>(
				"http://localhost/upload",
				{
					method: FetchMethods.Post,
					body: new Uint8Array(1),
				},
				FetchResultTypes.JSON,
			);

			expect(response.message).toBe(
				"Failed to parse body as JSON, this is expected!!",
			);
		});
	});

	describe("Unsuccessful fetches", () => {
		test("GIVEN fetch w/ unknown path THEN returns FetchError", async () => {
			const url = "http://localhost/404";
			const fetchResult = fetch(url, FetchResultTypes.JSON);

			await expect(fetchResult).rejects.toThrowError(
				`Failed to request '${url}' with code 404.`,
			);
			await expect(fetchResult).rejects.toBeInstanceOf(Error);

			try {
				await fetchResult;
			} catch (error) {
				expect((error as QueryError).message).toBe(
					`Failed to request '${url}' with code 404.`,
				);
				expect((error as QueryError).body).toBe('{"success":false}');
				expect((error as QueryError).code).toBe(404);
				expect((error as QueryError).url).toBe(url);
				expect((error as QueryError).toJSON()).toStrictEqual({
					success: false,
				});
			}
		});

		test("GIVEN fetch w/ unknown path AND URL object THEN returns FetchError", async () => {
			const url = new URL("http://localhost/404");
			const fetchResult = fetch(url, FetchResultTypes.JSON);

			await expect(fetchResult).rejects.toThrowError(
				`Failed to request '${url}' with code 404.`,
			);
			await expect(fetchResult).rejects.toBeInstanceOf(Error);

			try {
				await fetchResult;
			} catch (error) {
				expect((error as QueryError).message).toBe(
					`Failed to request '${url}' with code 404.`,
				);
				expect((error as QueryError).code).toBe(404);
				expect((error as QueryError).url).toBe(url.href);
				expect((error as QueryError).toJSON()).toStrictEqual({
					success: false,
				});
			}
		});

		test("GIVEN fetch w/ calling error.toJSON() twice THEN returns FetchError", async () => {
			const url = "http://localhost/404";
			const fetchResult = fetch(url, FetchResultTypes.JSON);

			await expect(fetchResult).rejects.toThrowError(
				`Failed to request '${url}' with code 404.`,
			);
			await expect(fetchResult).rejects.toBeInstanceOf(Error);

			try {
				await fetchResult;
			} catch (error) {
				expect((error as QueryError).toJSON()).toStrictEqual({
					success: false,
				});

				// This will use the cached value
				expect((error as QueryError).toJSON()).toStrictEqual({
					success: false,
				});
			}
		});

		test("GIVEN fetch w/ invalid type THEN throws", async () => {
			// @ts-expect-error handling error case
			await expect(
				fetch("http://localhost/simpleget", "type not found"),
			).rejects.toThrowError('Unknown type "type not found"');
		});
	});
});

describe("FetchMediaContentTypes", () => {
	test("GIVEN Entries of FetchMediaContentTypes THEN returns expected entries", () => {
		const MediaTypeEntries = [...Object.entries(FetchMediaContentTypes)];

		expect(MediaTypeEntries).toHaveLength(31);
		expect(MediaTypeEntries).toStrictEqual([
			["AudioAac", "audio/aac"],
			["AudioMp4", "audio/mp4"],
			["AudioMpeg", "audio/mpeg"],
			["AudioOgg", "audio/ogg"],
			["AudioOpus", "audio/opus"],
			["AudioVorbis", "audio/vorbis"],
			["AudioWav", "audio/wav"],
			["AudioWebm", "audio/webm"],
			["FontOtf", "font/otf"],
			["FontTtf", "font/ttf"],
			["FontWoff", "font/woff"],
			["FontWoff2", "font/woff2"],
			["FormData", "multipart/form-data"],
			["FormURLEncoded", "application/x-www-form-urlencoded"],
			["ImageAPNG", "image/apng"],
			["ImageGIF", "image/gif"],
			["ImageJPEG", "image/jpeg"],
			["ImagePNG", "image/png"],
			["ImageWEBP", "image/webp"],
			["JSON", "application/json"],
			["JavaScript", "application/javascript"],
			["OctetStream", "application/octet-stream"],
			["TextCSS", "text/css"],
			["TextHTML", "text/html"],
			["TextPlain", "text/plain"],
			["VideoH264", "video/h264"],
			["VideoH265", "video/h265"],
			["VideoMp4", "video/mp4"],
			["VideoOgg", "video/ogg"],
			["VideoWebm", "video/webm"],
			["XML", "application/xml"],
		]);
	});
});
