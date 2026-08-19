import type {
	PhishermanInfoType,
	PhishermanReportType,
	PhishermanReturnType,
} from "@types";
import {
	fetch,
	FetchMethods,
	FetchResultTypes,
	type QueryError,
} from "@utilities/fetch/index.ts";

/**
 * The `User-Agent` header sent with every request to the Phisherman API.
 */
const userAgent =
	"KairoJS Phisherman/1.0.0 (https://github.com/kairojs/kairojs)";

/**
 * The API key cached by {@link setApiKey}, used by every call that does not supply its own.
 */
let storedApiKey: string;

/**
 * Checks whether a domain is flagged as a scam or phishing domain by Phisherman.
 *
 * @param domain The domain to check.
 * @param apiKey The API key to authenticate with. Defaults to the key configured via {@link setApiKey}.
 *
 * @since 1.0.0
 */
export async function checkDomain(
	domain: string,
	apiKey: string = storedApiKey,
) {
	assertValidDomain(domain);
	const result = await fetch<PhishermanReturnType>(
		`https://api.phisherman.gg/v2/domains/check/${domain}`,
		{
			headers: {
				"Content-Type": "application/json",
				"User-Agent": userAgent,
				Authorization: `Bearer ${apiKey}`,
			},
		},
		FetchResultTypes.JSON,
	);

	return {
		...result,
		isScam:
			result.classification !== "safe" && result.classification !== "unknown",
	};
}

/**
 * Reports a domain confirmed to be a scam or phishing domain, helping improve Phisherman's dataset.
 *
 * @param domain The domain to report.
 * @param apiKey The API key to authenticate with. Defaults to the key configured via {@link setApiKey}.
 *
 * @since 1.0.0
 */
export function reportDomain(domain: string, apiKey: string = storedApiKey) {
	assertValidDomain(domain);
	return fetch<PhishermanReportType>(
		"https://api.phisherman.gg/v2/phish/report",
		{
			method: FetchMethods.Put,
			headers: {
				"Content-Type": "application/json",
				"User-Agent": userAgent,
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({ url: domain }),
		},
		FetchResultTypes.JSON,
	);
}

/**
 * Fetches Phisherman's extended information for a domain.
 *
 * @param domain The domain to look up.
 * @param apiKey The API key to authenticate with. Defaults to the key configured via {@link setApiKey}.
 *
 * @since 1.1.0
 */
export async function getDomainInfo(
	domain: string,
	apiKey: string = storedApiKey,
) {
	assertValidDomain(domain);
	const result = await fetch<PhishermanInfoType>(
		`https://api.phisherman.gg/v2/domains/info/${domain}`,
		{
			headers: {
				"Content-Type": "application/json",
				"User-Agent": userAgent,
				Authorization: `Bearer ${apiKey}`,
			},
		},
		FetchResultTypes.JSON,
	);
	return result[domain];
}

/**
 * Reports a phish that was caught, so Phisherman can refine its analytics.
 *
 * @param domain The domain that was caught.
 * @param apiKey The API key to authenticate with. Defaults to the key configured via {@link setApiKey}.
 * @param guildId The ID of the guild the domain was caught in.
 *
 * @since 1.1.0
 */
export function reportCaughtPhish(
	domain: string,
	apiKey: string = storedApiKey,
	guildId: string | number = "",
) {
	return fetch<PhishermanReportType>(
		`https://api.phisherman.gg/v2/phish/caught/${domain}`,
		{
			method: FetchMethods.Post,
			headers: {
				"Content-Type": "application/json",
				"User-Agent": userAgent,
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({ guild: Number(guildId) }),
		},
		FetchResultTypes.JSON,
	);
}

/**
 * Validates an API key against the Phisherman API and caches it for calls that don't supply their
 * own key.
 *
 * @param key The API key to validate and cache.
 *
 * @since 1.0.0
 */
export async function setApiKey(key: string) {
	await assertValidApiKey(key);
	storedApiKey = key;
}

/**
 * Confirms an API key is accepted by the Phisherman API, throwing a clear error otherwise.
 *
 * @param apiKey The API key to validate.
 */
async function assertValidApiKey(apiKey: string) {
	try {
		await fetch<{ message: string; success: false }>(
			"https://api.phisherman.gg/v2/domains/check/verified.test.phisherman.gg",
			{
				headers: {
					"Content-Type": "application/json",
					"User-Agent": userAgent,
					Authorization: `Bearer ${apiKey}`,
				},
			},
			FetchResultTypes.JSON,
		);
	} catch (error) {
		const queryError = error as QueryError;

		if (
			queryError.code === 401 &&
			(queryError.toJSON() as { message: string }).message ===
				"missing permissions or invalid API key"
		) {
			throw new Error("[KairoPhisherman]: Invalid API key provided");
		}

		throw error;
	}
}

/**
 * The pattern a value must match to be considered a well-formed domain.
 */
const domainRegex =
	/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

/**
 * Throws if the given value does not look like a valid domain.
 *
 * @param domain The value to validate.
 */
function assertValidDomain(domain: string) {
	if (!domain.match(domainRegex))
		throw new Error("[KairoPhisherman]: Invalid domain provided");
}
