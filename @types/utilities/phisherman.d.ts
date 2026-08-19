/**
 * Options accepted when configuring the Phisherman client.
 *
 * @since 1.0.0
 */
export interface PhishermanOptions {
	/**
	 * The Phisherman API key to authenticate requests with.
	 */
	apiKey: string;
}

/**
 * The raw response returned by the domain-check endpoint.
 *
 * @since 1.0.0
 */
export interface PhishermanReturnType {
	/**
	 * Whether this domain has been manually verified as a phishing domain.
	 */
	verifiedPhish: boolean;

	/**
	 * How Phisherman classifies this domain.
	 */
	classification: "malicious" | "suspicious" | "safe" | "unknown";
}

/**
 * A {@link PhishermanReturnType} augmented with the derived {@link CheckReturnType.isScam} flag
 * that `checkDomain` returns.
 *
 * @since 1.0.0
 */
export type CheckReturnType = PhishermanReturnType & {
	/**
	 * `true` unless {@link PhishermanReturnType.classification} is `"safe"` or `"unknown"`.
	 */
	isScam: boolean;
};

/**
 * The response returned by the report and caught-phish endpoints.
 *
 * @since 1.0.0
 */
export interface PhishermanReportType {
	/**
	 * Whether the report was accepted.
	 */
	success: boolean;

	/**
	 * A human-readable status message.
	 */
	message: string;
}

/**
 * The autonomous system a domain's IP address resolves through.
 *
 * @since 1.0.0
 */
export interface PhishermanInfoAsn {
	asn: string;
	asn_name: string;
	route: string;
}

/**
 * The registrant country associated with a domain.
 *
 * @since 1.0.0
 */
export interface PhishermanInfoCountry {
	code: string;
	name: string;
}

/**
 * The extended metadata Phisherman keeps about a checked domain.
 *
 * @since 1.0.0
 */
export interface PhishermanInfoDetails {
	phishTankId: string;
	urlScanId: string;
	websiteScreenshot: string;
	ip_address: string;
	asn: PhishermanInfoAsn;
	registry: string;
	country: PhishermanInfoCountry;
}

/**
 * The response returned by the domain-info endpoint for a single domain.
 *
 * @since 1.0.0
 */
export interface PhishermanInfo {
	status: string;
	created: string;
	lastChecked: string;
	verifiedPhish: boolean;
	classification: string;
	firstSeen: string;
	lastSeen: string;
	targetedBrand: string;
	phishCaught: number;
	details: PhishermanInfoDetails;
}

/**
 * The domain-info endpoint's response, keyed by the requested domain.
 *
 * @since 1.0.0
 */
export interface PhishermanInfoType {
	[key: string]: PhishermanInfo;
}
